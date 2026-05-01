'use client';

import { useEffect, useState } from 'react';
import { Phone, Mail, MapPin, Send, Loader2, MessageSquare, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface SiteSettings {
  businessPhone?: string;
  businessEmail?: string;
  businessAddress?: string;
}

interface ContactFormData {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactSection() {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch('/api/public/settings')
      .then((r) => r.json())
      .then((data) => setSettings(data.settings || {}))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!formData.phone.trim() || !/^\d{10}$/.test(formData.phone.trim())) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    if (!formData.message.trim()) {
      toast.error('Please enter your message');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Something went wrong');
        return;
      }

      setSubmitted(true);
      toast.success('Message sent successfully!');
      setFormData({ name: '', phone: '', email: '', subject: '', message: '' });

      // Reset success state after 5 seconds
      setTimeout(() => setSubmitted(false), 5000);
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const contactItems = [
    {
      icon: <Phone className="h-5 w-5" />,
      label: 'Call Us',
      value: settings.businessPhone || '+91 98765 43210',
      href: `tel:${settings.businessPhone || '+919876543210'}`,
    },
    {
      icon: <Mail className="h-5 w-5" />,
      label: 'Email Us',
      value: settings.businessEmail || 'info@lamkacoaching.com',
      href: `mailto:${settings.businessEmail || 'info@lamkacoaching.com'}`,
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      label: 'Visit Us',
      value: settings.businessAddress || 'Lamka, Churachandpur, Manipur',
      href: undefined,
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(6,182,212,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(6,182,212,0.2) 0%, transparent 50%)' }} />
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(6,182,212,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,.08) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left Column - Info */}
          <div className="flex flex-col justify-center">
            <Badge variant="secondary" className="mb-4 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 w-fit">
              <MessageSquare className="h-3 w-3 mr-1" />
              Get in Touch
            </Badge>

            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
              Have Questions?{' '}
              <span className="text-cyan-600 dark:text-cyan-400">We&apos;re Here to Help</span>
            </h2>

            <p className="mt-4 text-gray-500 dark:text-gray-400 text-lg leading-relaxed max-w-lg">
              Whether you want to know more about our courses, need help choosing the right program, or have any other queries — feel free to reach out.
            </p>

            {/* Contact Info Cards */}
            <div className="mt-8 flex flex-col gap-4">
              {contactItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md hover:border-cyan-200 dark:hover:border-cyan-800 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="h-12 w-12 rounded-full bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400 dark:text-gray-500">{item.label}</p>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="text-base font-semibold text-gray-900 dark:text-gray-100 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Thank you!</h3>
                <p className="text-gray-500 dark:text-gray-400">We&apos;ll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="contact-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contact-name"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-11 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    required
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="contact-phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="h-11 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="contact-email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-11 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="contact-subject" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Subject
                  </Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(value) => setFormData({ ...formData, subject: value })}
                  >
                    <SelectTrigger id="contact-subject" className="w-full h-11 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Course Inquiry">Course Inquiry</SelectItem>
                      <SelectItem value="Cabin Booking">Cabin Booking</SelectItem>
                      <SelectItem value="Fee Structure">Fee Structure</SelectItem>
                      <SelectItem value="General Inquiry">General Inquiry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="contact-message" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Message <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="contact-message"
                    placeholder="How can we help you?"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="min-h-[120px] rounded-lg resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    required
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg text-base transition-colors"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
