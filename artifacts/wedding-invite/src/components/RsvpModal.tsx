import React from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateRsvp, useGetRsvpCount } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListRsvpsQueryKey, getGetRsvpCountQueryKey } from "@workspace/api-client-react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Invitation } from "@workspace/api-client-react";
import { BottomSheet } from "@/components/BottomSheet";

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function parseTimeSlots(value: unknown): string[] {
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((s) => s.trim()).filter(Boolean);
  }
  const arr = safeJsonParse<string[]>(value, []);
  if (Array.isArray(arr)) return arr.map(String).filter(Boolean);
  return [];
}

interface RsvpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
  cardFontVars?: React.CSSProperties;
  invitation?: Invitation | Record<string, unknown>;
  token?: string;
  inset?: boolean;
}

export function RsvpModal({ isOpen, onClose, onSubmitted, cardFontVars, invitation, token, inset }: RsvpModalProps) {
  const queryClient = useQueryClient();
  const createRsvp = useCreateRsvp();
  const inv = invitation as Record<string, unknown> | undefined;
  const resolvedToken = token ?? (inv?.token as string | undefined) ?? "";

  const enabled = inv?.rsvpEnabled === true;
  const deadline = (inv?.rsvpDeadline as string | undefined) ? new Date(inv?.rsvpDeadline as string) : null;
  const introText = (inv?.rsvpIntroText as string | undefined) ?? "";
  const language = inv?.language === "en" ? "en" : "ms";
  const copy = language === "en"
    ? {
        title: "Attendance Confirmation",
        defaultIntro: "Please confirm your attendance.",
        name: "Name",
        namePlaceholder: "Your name",
        attendance: "Will you be attending?",
        yes: "Yes",
        no: "No",
        guests: "Number of guests",
        wishes: "Message (optional)",
        wishesPlaceholder: "Leave a message for the couple...",
        close: "Close",
        cancel: "Cancel",
        submit: "Submit",
        success: "Thank you! Your RSVP has been submitted.",
        disabled: "RSVP is currently unavailable.",
        deadline: "The RSVP deadline has passed.",
        overallLimit: "The guest limit has been reached.",
        perInvitationLimit: "The maximum number of guests per invitation has been reached.",
      }
    : {
        title: "Pengesahan Kehadiran",
        defaultIntro: "Sila sahkan kehadiran anda.",
        name: "Nama",
        namePlaceholder: "Nama anda",
        attendance: "Adakah anda akan hadir?",
        yes: "Ya",
        no: "Tidak",
        guests: "Bilangan tetamu",
        wishes: "Ucapan (jika ada)",
        wishesPlaceholder: "Tinggalkan ucapan untuk pengantin...",
        close: "Tutup",
        cancel: "Batal",
        submit: "Hantar",
        success: "Terima kasih! RSVP anda telah dihantar.",
        disabled: "RSVP tidak dibuka buat masa ini.",
        deadline: "Tempoh RSVP telah tamat.",
        overallLimit: "Had keseluruhan tetamu telah dicapai.",
        perInvitationLimit: "Had tetamu untuk jemputan ini telah dicapai.",
      };
  const maxGuestsPerInvitation = Math.max(1, Number(inv?.rsvpMaxGuestsPerInvitation ?? 10));
  const maxOverallGuests = Math.max(0, Number(inv?.rsvpMaxOverallGuests ?? 1000));

  const isDeadlinePassed = deadline ? deadline.getTime() < Date.now() : false;
  const { data: rsvpCount } = useGetRsvpCount(resolvedToken ? { invitationToken: resolvedToken } : undefined);
  const currentTotalGuests = (rsvpCount as { totalGuests?: number } | undefined)?.totalGuests ?? 0;
  const isOverallLimitReached = maxOverallGuests > 0 && currentTotalGuests >= maxOverallGuests;

  const formSchema = z.object({
    name: z.string().min(2, "Sila masukkan nama"),
    attending: z.string(),
    numberOfGuests: z.coerce.number().min(1),
    message: z.string().optional(),
  });
  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(
      formSchema.extend({
        numberOfGuests: z.coerce.number().min(1).max(maxGuestsPerInvitation),
      })
    ),
    defaultValues: {
      name: "",
      attending: "yes",
      numberOfGuests: 1,
      message: "",
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        name: "",
        attending: "yes",
        numberOfGuests: 1,
        message: "",
      });
    }
  }, [isOpen]);

  const onSubmit = (values: FormValues) => {
    if (!resolvedToken) {
      toast.error("Invitation token is missing");
      return;
    }
    createRsvp.mutate(
      {
        data: {
          invitationToken: resolvedToken,
          name: values.name,
          attending: values.attending === "yes",
          numberOfGuests: values.numberOfGuests,
          message: values.message,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRsvpsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRsvpCountQueryKey(resolvedToken ? { invitationToken: resolvedToken } : undefined) });
          onSubmitted?.();
          toast.success(copy.success);
          onClose();
          form.reset();
        },
        onError: (error) => {
          const err = error as { response?: { data?: { error?: string } } };
          const serverMessage = err?.response?.data?.error;
          const message = serverMessage === "Guest limit has been reached"
            ? copy.overallLimit
            : serverMessage?.startsWith("Maximum")
              ? copy.perInvitationLimit
              : serverMessage ?? (language === "en" ? "Something went wrong. Please try again." : "Ralat berlaku. Sila cuba lagi.");
          toast.error(message);
        }
      }
    );
  };

  const closedState = !enabled || isDeadlinePassed || isOverallLimitReached;
  const closedTitle = copy.title;
  let closedMessage = introText || copy.defaultIntro;
  if (!enabled) {
    closedMessage = copy.disabled;
  } else if (isDeadlinePassed) {
    closedMessage = copy.deadline;
  } else if (isOverallLimitReached) {
    closedMessage = copy.overallLimit;
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={closedTitle}
      inset={inset}
      style={cardFontVars}
    >
      {closedState ? (
        <div className="pb-2">
          <p
            className="text-xs text-center text-muted-foreground mb-5"
            style={{ fontFamily: "var(--body-font-family, Poppins, sans-serif)" }}
          >
            {closedMessage}
          </p>
          <Button type="button" variant="outline" onClick={onClose} className="w-full">
            {copy.close}
          </Button>
        </div>
      ) : (
        <div className="pb-2">
          <p
            className="text-xs text-center text-muted-foreground mb-4"
            style={{ fontFamily: "var(--body-font-family, Poppins, sans-serif)" }}
          >
            {introText || copy.defaultIntro}
          </p>

          <Form {...form}>
            <form className="space-y-3 text-sm">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{copy.name}</FormLabel>
                    <FormControl>
                      <Input placeholder={copy.namePlaceholder} {...field} className="bg-background" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="attending"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>{copy.attendance}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="yes" />
                          </FormControl>
                          <FormLabel className="font-normal">{copy.yes}</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="no" />
                          </FormControl>
                          <FormLabel className="font-normal">{copy.no}</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("attending") === "yes" && (
                <FormField
                  control={form.control}
                  name="numberOfGuests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{copy.guests}</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={maxGuestsPerInvitation} {...field} className="bg-background" />
                      </FormControl>
                      <p className="text-[10px] text-muted-foreground">
                        {language === "en"
                          ? `Maximum ${maxGuestsPerInvitation} guests for this invitation.`
                          : `Maksimum ${maxGuestsPerInvitation} tetamu untuk jemputan ini.`}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{copy.wishes}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={copy.wishesPlaceholder}
                        className="resize-none bg-background"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {copy.cancel}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              disabled={createRsvp.isPending}
              onClick={form.handleSubmit(onSubmit)}
            >
              {createRsvp.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              {copy.submit}
            </Button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
