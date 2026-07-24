import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateRsvp } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListRsvpsQueryKey } from "@workspace/api-client-react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Invitation } from "@workspace/db";

const formSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  attending: z.string(),
  side: z.string().optional(),
  numberOfGuests: z.coerce.number().min(1),
  message: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface RsvpModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardFontVars?: React.CSSProperties;
  invitation?: Invitation | Record<string, unknown>;
}

export function RsvpModal({ isOpen, onClose, cardFontVars, invitation }: RsvpModalProps) {
  const queryClient = useQueryClient();
  const createRsvp = useCreateRsvp();
  const inv = invitation as Record<string, unknown> | undefined;
  const showSide = inv?.rsvpShowSide === true;
  const maxGuests = Math.max(1, Math.min(20, Number(inv?.rsvpMaxGuests ?? 5)));
  const sideOptions = [
    { value: "groom", label: "Pihak Pengantin Lelaki" },
    { value: "bride", label: "Pihak Pengantin Perempuan" },
    { value: "both", label: "Kedua-dua Pihak" },
  ];

  const dynamicSchema = formSchema.extend({
    numberOfGuests: z.coerce.number().min(1).max(maxGuests),
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: {
      name: "",
      attending: "yes",
      side: "",
      numberOfGuests: 1,
      message: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    createRsvp.mutate(
      {
        data: {
          name: values.name,
          attending: values.attending === "yes",
          numberOfGuests: values.numberOfGuests,
          side: showSide ? values.side : undefined,
          message: values.message,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRsvpsQueryKey() });
          toast.success("Thank you! Your RSVP has been submitted.");
          onClose();
          form.reset();
        },
        onError: () => {
          toast.error("An error occurred. Please try again.");
        }
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] border-primary/20 bg-card" style={cardFontVars}>
        <DialogHeader>
          <DialogTitle
            className="text-2xl text-center text-primary"
            style={{ fontFamily: "var(--name-font-family, 'Dancing Script', serif)" }}
          >
            Attendance (RSVP)
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground" style={{ fontFamily: "var(--body-font-family, Poppins, sans-serif)" }}>
            Please confirm your attendance before the event.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} className="bg-background" />
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
                  <FormLabel>Will you be attending?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="yes" />
                        </FormControl>
                        <FormLabel className="font-normal">Yes, I will attend</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="no" />
                        </FormControl>
                        <FormLabel className="font-normal">Sorry, I cannot attend</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showSide && (
              <FormField
                control={form.control}
                name="side"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dari</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Pilih pihak</option>
                        {sideOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
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
                      <Input type="number" min={1} max={maxGuests} {...field} className="bg-background" />
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
      </DialogContent>
    </Dialog>
  );
}
