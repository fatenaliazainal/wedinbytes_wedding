import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
import { getListRsvpsQueryKey } from "@workspace/api-client-react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Invitation } from "@workspace/api-client-react";

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
  cardFontVars?: React.CSSProperties;
  invitation?: Invitation | Record<string, unknown>;
  token?: string;
}

export function RsvpModal({ isOpen, onClose, cardFontVars, invitation, token }: RsvpModalProps) {
  const queryClient = useQueryClient();
  const createRsvp = useCreateRsvp();
  const inv = invitation as Record<string, unknown> | undefined;
  const resolvedToken = token ?? (inv?.token as string | undefined) ?? "";

  const enabled = inv?.rsvpEnabled === true;
  const additionalInfo = (inv?.rsvpAdditionalInfo as string | undefined) ?? "";
  const deadline = (inv?.rsvpDeadline as string | undefined) ? new Date(inv?.rsvpDeadline as string) : null;
  const introText = (inv?.rsvpIntroText as string | undefined) ?? "";
  const formNote = (inv?.rsvpFormNote as string | undefined) ?? "";
  const maxGuestsPerInvitation = Math.max(1, Number(inv?.rsvpMaxGuestsPerInvitation ?? 10));
  const maxOverallGuests = Math.max(0, Number(inv?.rsvpMaxOverallGuests ?? 1000));
  const timeSlots = parseTimeSlots(inv?.rsvpTimeSlots);

  const isDeadlinePassed = deadline ? deadline.getTime() < Date.now() : false;
  const { data: rsvpCount } = useGetRsvpCount(resolvedToken ? { invitationToken: resolvedToken } : undefined);
  const currentTotalGuests = (rsvpCount as { totalGuests?: number } | undefined)?.totalGuests ?? 0;
  const isOverallLimitReached = maxOverallGuests > 0 && currentTotalGuests >= maxOverallGuests;

  const formSchema = z.object({
    name: z.string().min(2, "Sila masukkan nama"),
    attending: z.string(),
    numberOfGuests: z.coerce.number().min(1),
    timeSlot: z.string().optional(),
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
      timeSlot: timeSlots[0] ?? "",
      message: "",
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        name: "",
        attending: "yes",
        numberOfGuests: 1,
        timeSlot: timeSlots[0] ?? "",
        message: "",
      });
    }
  }, [isOpen, timeSlots.join(",")]);

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
          timeSlot: timeSlots.length > 0 ? values.timeSlot : undefined,
          message: values.message,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRsvpsQueryKey() });
          toast.success("Terima kasih! RSVP anda telah dihantar.");
          onClose();
          form.reset();
        },
        onError: (error) => {
          const err = error as { response?: { data?: { error?: string } } };
          toast.error(err?.response?.data?.error ?? "Ralat berlaku. Sila cuba lagi.");
        }
      }
    );
  };

  const closedState = !enabled || isDeadlinePassed || isOverallLimitReached;
  let closedTitle = "Attendance (RSVP)";
  let closedMessage = introText || "Please confirm your attendance before the event.";
  if (!enabled) {
    closedTitle = "RSVP";
    closedMessage = "RSVP tidak dibuka buat masa ini.";
  } else if (isDeadlinePassed) {
    closedTitle = "RSVP Closed";
    closedMessage = "Tempoh RSVP telah tamat.";
  } else if (isOverallLimitReached) {
    closedTitle = "Guest limit has been reached";
    closedMessage = "Had kehaduran tetamu telah mencapai had maksima.";
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] border-primary/20 bg-card" style={cardFontVars}>
        <DialogHeader>
          <DialogTitle
            className="text-2xl text-center text-primary"
            style={{ fontFamily: "var(--name-font-family, 'Dancing Script', serif)" }}
          >
            {closedTitle}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground" style={{ fontFamily: "var(--body-font-family, Poppins, sans-serif)" }}>
            {closedMessage}
          </DialogDescription>
        </DialogHeader>

        {closedState ? (
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="w-full">
              Tutup
            </Button>
          </DialogFooter>
        ) : (
          <>
            {additionalInfo && (
              <div
                className="text-sm text-muted-foreground"
                style={{ fontFamily: "var(--body-font-family, Poppins, sans-serif)" }}
                dangerouslySetInnerHTML={{ __html: additionalInfo }}
              />
            )}

            <Form {...form}>
              <form className="space-y-5 mt-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama anda" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="attending"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Adakah anda akan hadir?</FormLabel>
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
                            <FormLabel className="font-normal">Ya, saya akan hadir</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="no" />
                            </FormControl>
                            <FormLabel className="font-normal">Maaf, saya tidak dapat hadir</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {timeSlots.length > 0 && (
                  <FormField
                    control={form.control}
                    name="timeSlot"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slot Masa</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Pilih slot masa</option>
                            {timeSlots.map((slot) => (
                              <option key={slot} value={slot}>{slot}</option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {form.watch("attending") === "yes" && (
                  <FormField
                    control={form.control}
                    name="numberOfGuests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bilangan Kehadiran</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={maxGuestsPerInvitation} {...field} className="bg-background" />
                        </FormControl>
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
                      <FormLabel>Ucapan (Jika ada)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tinggalkan ucapan untuk pengantin..."
                          className="resize-none bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {formNote && (
                  <div
                    className="text-xs text-muted-foreground"
                    style={{ fontFamily: "var(--body-font-family, Poppins, sans-serif)" }}
                    dangerouslySetInnerHTML={{ __html: formNote }}
                  />
                )}
              </form>
            </Form>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Batal
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                disabled={createRsvp.isPending}
                onClick={form.handleSubmit(onSubmit)}
              >
                {createRsvp.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                Hantar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
