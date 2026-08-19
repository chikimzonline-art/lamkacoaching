'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  DoorOpen,
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  Megaphone,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface BusinessSettings {
  businessName?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessAddress?: string;
  businessDescription?: string;
  footerCtaTitle?: string;
  footerCtaSubtitle?: string;
}

const baseQuickLinks = [
  { href: '/', label: 'Home' },
  { href: '/courses', label: 'Our Courses' },
  { href: '/computer-training', label: 'Computer Training' },
  { href: '/about', label: 'About Us' },
  { href: '/notices', label: 'Notices' },
  { href: '/admin', label: 'Admin Portal' },
];

const registerSubLinks = [
  { href: '/register', label: 'Coaching Class', icon: GraduationCap },
  { href: '/cabins', label: 'Study Cabin', icon: DoorOpen },
];

const quickActions = [
  { href: '/cabins', label: 'Book a Cabin', icon: DoorOpen },
  { href: '/register', label: 'Register for Course', icon: GraduationCap },
  { href: '/notices', label: 'View Notices', icon: Megaphone },
];

const socialLinks = [
  { icon: Facebook, label: 'Facebook' },
  { icon: Instagram, label: 'Instagram' },
  { icon: Youtube, label: 'Youtube' },
  { icon: Twitter, label: 'Twitter' },
];

export default function PublicFooter() {
  const [settings, setSettings] = useState<BusinessSettings>({});
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const name = settings.businessName || 'Lamka Coaching Center';

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (res.status === 409) {
        toast.error('This email is already subscribed.');
        return;
      }

      if (!res.ok) {
        toast.error(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setSubscribed(true);
      setEmail('');
      toast.success(data.message || 'Subscribed successfully!');
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/public/settings')
      .then((res) => res.json())
      .then((data) => setSettings(data.settings || {}))
      .catch(() => {});
  }, []);

  const ctaTitle = settings.footerCtaTitle || 'New Batches Starting Soon!';
  const ctaSubtitle = settings.footerCtaSubtitle || 'Enroll now to secure your seat.';

  return (
    <footer className="bg-gray-950 text-gray-400 border-t border-gray-800 transition-colors">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About + Social + Newsletter */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 to-sky-500 text-white shadow-md shadow-cyan-500/20">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="font-bold text-white text-lg">{name}</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              {settings.businessDescription ||
                'Empowering students with quality coaching for competitive exams. Your success is our mission.'}
            </p>

            {/* Social Media Icons */}
            <div className="flex items-center gap-2 mt-5">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="h-8 w-8 rounded-lg bg-gray-900 hover:bg-cyan-950/50 flex items-center justify-center text-gray-400 hover:text-cyan-400 border border-gray-800 hover:border-cyan-800 transition-all"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>

            {/* Newsletter CTA */}
            <div className="mt-6 bg-gray-900/80 rounded-xl border border-gray-800 p-4">
              {subscribed ? (
                <div className="flex items-center gap-2 text-emerald-400 text-xs py-1">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Thank you for subscribing!</span>
                </div>
              ) : (
                <>
                  <p className="text-xs text-gray-400 mb-2.5 font-medium">
                    Stay updated with our latest news and batch announcements
                  </p>
                  <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="flex-1 bg-gray-950 text-white text-xs px-3 py-2 rounded-lg border border-gray-700 placeholder:text-gray-500 focus:outline-none focus:border-cyan-500 min-w-0"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          ...
                        </>
                      ) : (
                        'Subscribe'
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-sm mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {baseQuickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {/* Register with sub-items */}
              <li>
                <span className="text-sm text-gray-200 font-medium">Register</span>
                <ul className="ml-3 mt-1.5 space-y-2">
                  {registerSubLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold text-sm mb-4">Contact Us</h3>
            <ul className="space-y-3">
              {settings.businessPhone && (
                <li className="flex items-start gap-2.5">
                  <Phone className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
                  <a href={`tel:${settings.businessPhone}`} className="text-sm text-gray-400 hover:text-cyan-400 transition-colors">
                    {settings.businessPhone}
                  </a>
                </li>
              )}
              {settings.businessEmail && (
                <li className="flex items-start gap-2.5">
                  <Mail className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
                  <a href={`mailto:${settings.businessEmail}`} className="text-sm text-gray-400 hover:text-cyan-400 transition-colors break-all">
                    {settings.businessEmail}
                  </a>
                </li>
              )}
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
                <span className="text-sm text-gray-400">
                  {settings.businessAddress || 'Lamka, Churachandpur, Manipur'}
                </span>
              </li>
            </ul>
          </div>

          {/* Quick Actions + Study Hours */}
          <div>
            <h3 className="text-white font-bold text-sm mb-4">Quick Actions</h3>
            <ul className="space-y-2.5">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <li key={action.href}>
                    <Link
                      href={action.href}
                      className="flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                    >
                      <Icon className="h-4 w-4" />
                      {action.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Study Hours sub-section */}
            <div className="mt-6">
              <h4 className="text-white font-semibold text-xs mb-3 uppercase tracking-wider">Study Hours</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex justify-between">
                  <span>Mon - Sat</span>
                  <span className="font-medium text-gray-200">6:00 AM - 10:00 PM</span>
                </li>
                <li className="flex justify-between">
                  <span>Sunday</span>
                  <span className="font-medium text-gray-200">8:00 AM - 6:00 PM</span>
                </li>
              </ul>
              <div className="mt-4 p-3 bg-gray-900 rounded-xl border border-gray-800">
                <p className="text-xs text-cyan-400 font-semibold">{ctaTitle}</p>
                <p className="text-xs text-gray-400 mt-0.5">{ctaSubtitle}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="h-px bg-gray-800" />

      {/* Bottom Bar */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-gray-500">
            Made with ❤️ in Lamka
          </p>
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} {name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
