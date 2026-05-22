'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, DollarSign, Building2, Save, Users, Plus, Pencil, Trash2, Shield, ShieldCheck, Loader2, UserCircle, Eye, EyeOff, Phone, Globe, ImagePlus, Upload, X, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';

interface SettingsData {
  business_name: string;
  operating_hours_start: string;
  operating_hours_end: string;
  hourly_rate: string;
  monthly_rate: string;
  business_phone: string;
  business_email: string;
  business_address: string;
  hero_badge_text: string;
  hero_banner_text: string;
  footer_cta_title: string;
  footer_cta_subtitle: string;
  logo_url: string;
  favicon_url: string;
}

interface UserRecord {
  id: string;
  username: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const defaultSettings: SettingsData = {
  business_name: 'Lamka Coaching Center',
  operating_hours_start: '07:00',
  operating_hours_end: '22:00',
  hourly_rate: '1000',
  monthly_rate: '3000',
  business_phone: '',
  business_email: '',
  business_address: '',
  hero_badge_text: 'Admissions Open 2025-26',
  hero_banner_text: 'New batches starting soon!',
  footer_cta_title: 'New Batches Starting Soon!',
  footer_cta_subtitle: 'Enroll now to secure your seat.',
  logo_url: '',
  favicon_url: '',
};

function useSettingsState() {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const json = await res.json();
      if (json.settings) {
        setSettings({
          business_name: json.settings.business_name || defaultSettings.business_name,
          operating_hours_start: json.settings.operating_hours_start || defaultSettings.operating_hours_start,
          operating_hours_end: json.settings.operating_hours_end || defaultSettings.operating_hours_end,
          hourly_rate: json.settings.hourly_rate || defaultSettings.hourly_rate,
          monthly_rate: json.settings.monthly_rate || defaultSettings.monthly_rate,
          business_phone: json.settings.business_phone || defaultSettings.business_phone,
          business_email: json.settings.business_email || defaultSettings.business_email,
          business_address: json.settings.business_address || defaultSettings.business_address,
          hero_badge_text: json.settings.hero_badge_text || defaultSettings.hero_badge_text,
          hero_banner_text: json.settings.hero_banner_text || defaultSettings.hero_banner_text,
          footer_cta_title: json.settings.footer_cta_title || defaultSettings.footer_cta_title,
          footer_cta_subtitle: json.settings.footer_cta_subtitle || defaultSettings.footer_cta_subtitle,
          logo_url: json.settings.logo_url || defaultSettings.logo_url,
          favicon_url: json.settings.favicon_url || defaultSettings.favicon_url,
        });
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Failed to save settings');
        return;
      }
      toast.success('Settings saved successfully');
      fetchSettings();
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return { settings, setSettings, loading, saving, handleSave };
}

export default function SettingsViewWrapper() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const { settings, setSettings, loading, saving, handleSave } = useSettingsState();
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large. Maximum size: 2MB');
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'].includes(file.type)) {
      toast.error('Invalid file type. Allowed: PNG, JPEG, SVG, WebP');
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'logo');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Failed to upload logo');
        return;
      }

      setSettings({ ...settings, logo_url: json.url });
      toast.success('Logo uploaded successfully');
    } catch {
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      // Reset the input so the same file can be re-uploaded
      e.target.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await fetch('/api/upload?type=logo', { method: 'DELETE' });
      setSettings({ ...settings, logo_url: '' });
      toast.success('Logo removed');
    } catch {
      toast.error('Failed to remove logo');
    }
  };

  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large. Maximum size: 2MB');
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'].includes(file.type)) {
      toast.error('Invalid file type. Allowed: PNG, JPEG, SVG, WebP, ICO');
      return;
    }

    setUploadingFavicon(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'favicon');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Failed to upload favicon');
        return;
      }

      setSettings({ ...settings, favicon_url: json.url });
      toast.success('Favicon uploaded successfully');
    } catch {
      toast.error('Failed to upload favicon');
    } finally {
      setUploadingFavicon(false);
      e.target.value = '';
    }
  };

  const handleRemoveFavicon = async () => {
    try {
      await fetch('/api/upload?type=favicon', { method: 'DELETE' });
      setSettings({ ...settings, favicon_url: '' });
      toast.success('Favicon removed');
    } catch {
      toast.error('Failed to remove favicon');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Logo & Branding */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ImagePlus className="h-5 w-5 text-cyan-600" />
            Logo & Branding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-6">
            {/* Logo Preview */}
            <div className="shrink-0">
              {settings.logo_url ? (
                <div className="relative group">
                  <div className="h-20 w-20 rounded-xl border-2 border-gray-200 overflow-hidden bg-white flex items-center justify-center">
                    <img
                      src={settings.logo_url}
                      alt="Logo"
                      className="h-full w-full object-contain p-1"
                    />
                  </div>
                  <button
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Remove logo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="h-20 w-20 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-1">
                  <ImagePlus className="h-6 w-6 text-gray-400" />
                  <span className="text-[9px] text-gray-400 font-medium">No logo</span>
                </div>
              )}
            </div>

            {/* Upload area */}
            <div className="flex-1 space-y-3">
              <div>
                <Label className="text-sm font-medium">Upload Logo</Label>
                <p className="text-xs text-gray-400 mt-0.5">
                  Recommended: Square image, at least 200×200px. PNG, JPEG, SVG, or WebP. Max 2MB.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={uploadingLogo}
                  />
                  <span className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    uploadingLogo
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100 hover:border-cyan-300"
                  )}>
                    {uploadingLogo ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Choose File
                      </>
                    )}
                  </span>
                </label>
                {settings.logo_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveLogo}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex items-start gap-6">
            {/* Favicon Preview */}
            <div className="shrink-0">
              {settings.favicon_url ? (
                <div className="relative group">
                  <div className="h-16 w-16 rounded-xl border-2 border-gray-200 overflow-hidden bg-white flex items-center justify-center">
                    <img
                      src={settings.favicon_url}
                      alt="Favicon"
                      className="h-8 w-8 object-contain p-0.5"
                    />
                  </div>
                  <button
                    onClick={handleRemoveFavicon}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Remove favicon"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="h-16 w-16 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-1">
                  <ImagePlus className="h-5 w-5 text-gray-400" />
                  <span className="text-[9px] text-gray-400 font-medium">No icon</span>
                </div>
              )}
            </div>

            {/* Upload area */}
            <div className="flex-1 space-y-3">
              <div>
                <Label className="text-sm font-medium">Upload Favicon</Label>
                <p className="text-xs text-gray-400 mt-0.5">
                  Recommended: 32×32px or 48×48px. PNG, ICO, SVG, or WebP. Max 2MB.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp,image/x-icon,image/vnd.microsoft.icon"
                    onChange={handleFaviconUpload}
                    className="hidden"
                    disabled={uploadingFavicon}
                  />
                  <span className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    uploadingFavicon
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100 hover:border-cyan-300"
                  )}>
                    {uploadingFavicon ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Choose File
                      </>
                    )}
                  </span>
                </label>
                {settings.favicon_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveFavicon}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Header Preview */}
          <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <div className="flex items-center gap-2.5">
              {settings.logo_url ? (
                <div className="h-9 w-9 rounded-lg bg-white border border-gray-200 overflow-hidden flex items-center justify-center shadow-sm">
                  <img
                    src={settings.logo_url}
                    alt="Logo preview"
                    className="h-full w-full object-contain p-0.5"
                  />
                </div>
              ) : (
                <div className="h-9 w-9 rounded-lg bg-cyan-600 text-white flex items-center justify-center">
                  <BookOpen className="h-5 w-5" />
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-gray-900 leading-tight">
                  {settings.business_name?.split(' ').slice(0, 2).join(' ') || 'Business Name'}
                </p>
                <p className="text-[10px] text-gray-400 -mt-0.5 leading-tight">
                  {settings.business_name?.split(' ').slice(2).join(' ') || 'Tagline'}
                </p>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Preview — how your logo appears in the header
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-cyan-600" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business_name">Business Name</Label>
            <Input
              id="business_name"
              value={settings.business_name}
              onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
              placeholder="Your business name"
            />
          </div>
        </CardContent>
      </Card>

      {/* Operating Hours */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-cyan-600" />
            Operating Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="op_start">Opening Time</Label>
              <Input
                id="op_start"
                type="time"
                value={settings.operating_hours_start}
                onChange={(e) =>
                  setSettings({ ...settings, operating_hours_start: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="op_end">Closing Time</Label>
              <Input
                id="op_end"
                type="time"
                value={settings.operating_hours_end}
                onChange={(e) =>
                  setSettings({ ...settings, operating_hours_end: e.target.value })
                }
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            These hours are used for reference when creating bookings.
          </p>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-cyan-600" />
            Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Hourly Booking Fee (₹/month)</Label>
              <Input
                id="hourly_rate"
                type="number"
                value={settings.hourly_rate}
                onChange={(e) => setSettings({ ...settings, hourly_rate: e.target.value })}
                min={1}
              />
              <p className="text-xs text-gray-400">Monthly fee for hourly booking (5 hrs/day, 1 month duration)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly_rate">Full-Day Monthly Rate (₹)</Label>
              <Input
                id="monthly_rate"
                type="number"
                value={settings.monthly_rate}
                onChange={(e) => setSettings({ ...settings, monthly_rate: e.target.value })}
                min={1}
              />
              <p className="text-xs text-gray-400">Rate per month for exclusive (full-day) bookings</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Details */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Phone className="h-5 w-5 text-cyan-600" />
            Contact Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business_phone">Business Phone</Label>
            <Input
              id="business_phone"
              value={settings.business_phone}
              onChange={(e) => setSettings({ ...settings, business_phone: e.target.value })}
              placeholder="e.g. +91 9876543210"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="business_email">Business Email</Label>
            <Input
              id="business_email"
              type="email"
              value={settings.business_email}
              onChange={(e) => setSettings({ ...settings, business_email: e.target.value })}
              placeholder="e.g. info@lamkacoaching.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="business_address">Business Address</Label>
            <Input
              id="business_address"
              value={settings.business_address}
              onChange={(e) => setSettings({ ...settings, business_address: e.target.value })}
              placeholder="e.g. Lamka, Churachandpur, Manipur"
            />
          </div>
        </CardContent>
      </Card>

      {/* Website Content */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5 text-cyan-600" />
            Website Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hero_badge_text">Hero Badge Text</Label>
            <Input
              id="hero_badge_text"
              value={settings.hero_badge_text}
              onChange={(e) => setSettings({ ...settings, hero_badge_text: e.target.value })}
              placeholder="e.g. Admissions Open 2025-26"
            />
            <p className="text-xs text-gray-400">Shown as a badge on the homepage hero section</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero_banner_text">Hero Banner Text</Label>
            <Input
              id="hero_banner_text"
              value={settings.hero_banner_text}
              onChange={(e) => setSettings({ ...settings, hero_banner_text: e.target.value })}
              placeholder="e.g. New batches starting soon!"
            />
            <p className="text-xs text-gray-400">Shown in the floating accent card on the homepage</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="footer_cta_title">Footer CTA Title</Label>
            <Input
              id="footer_cta_title"
              value={settings.footer_cta_title}
              onChange={(e) => setSettings({ ...settings, footer_cta_title: e.target.value })}
              placeholder="e.g. New Batches Starting Soon!"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="footer_cta_subtitle">Footer CTA Subtitle</Label>
            <Input
              id="footer_cta_subtitle"
              value={settings.footer_cta_subtitle}
              onChange={(e) => setSettings({ ...settings, footer_cta_subtitle: e.target.value })}
              placeholder="e.g. Enroll now to secure your seat."
            />
          </div>

          {/* Live Preview */}
          {settings.hero_badge_text && (
            <div className="mt-4 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="h-4 w-4 text-cyan-600" />
                <span className="text-sm font-medium text-cyan-700">Live Preview — Hero Badge</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 text-cyan-700 border border-cyan-200 rounded-full text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                {settings.hero_badge_text}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-cyan-600 hover:bg-cyan-700 px-8"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* User Management - Admin only */}
      {isAdmin && (
        <>
          <Separator className="my-2" />
          <UserManagement />
        </>
      )}
    </div>
  );
}

function UserManagement() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserRecord | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formUsername, setFormUsername] = useState('');
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'staff'>('staff');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const resetForm = () => {
    setFormUsername('');
    setFormName('');
    setFormRole('staff');
    setFormPassword('');
    setShowPassword(false);
    setEditingUser(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (user: UserRecord) => {
    setEditingUser(user);
    setFormUsername(user.username);
    setFormName(user.name);
    setFormRole(user.role as 'admin' | 'staff');
    setFormPassword('');
    setShowPassword(false);
    setDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!formName.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!editingUser && !formUsername.trim()) {
      toast.error('Username is required');
      return;
    }

    if (!editingUser && formPassword.length < 4) {
      toast.error('Password must be at least 4 characters');
      return;
    }

    setSaving(true);
    try {
      if (editingUser) {
        const body: Record<string, unknown> = {
          id: editingUser.id,
          name: formName.trim(),
          role: formRole,
        };
        if (formPassword.length >= 4) {
          body.password = formPassword;
        }

        const res = await fetch('/api/auth/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || 'Failed to update user');
          return;
        }
        toast.success('User updated successfully');
      } else {
        const res = await fetch('/api/auth/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formUsername.trim(),
            password: formPassword,
            name: formName.trim(),
            role: formRole,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || 'Failed to create user');
          return;
        }
        toast.success('User created successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch {
      toast.error('Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (u: UserRecord) => {
    try {
      const res = await fetch('/api/auth/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: u.id, active: !u.active }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to update user');
        return;
      }
      toast.success(`User ${u.active ? 'disabled' : 'enabled'} successfully`);
      fetchUsers();
    } catch {
      toast.error('Failed to update user');
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    try {
      const res = await fetch(`/api/auth/users?id=${deleteUser.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to delete user');
        return;
      }
      toast.success('User deleted successfully');
      setDeleteUser(null);
      fetchUsers();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-600" />
            User Management
          </h2>
          <p className="text-sm text-gray-500">Manage system access and roles</p>
        </div>
        <Button
          onClick={openCreateDialog}
          size="sm"
          className="bg-cyan-600 hover:bg-cyan-700"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add User
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.map((u) => (
                <div
                  key={u.id}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    !u.active ? 'opacity-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div
                    className={`flex items-center justify-center h-10 w-10 rounded-full shrink-0 ${
                      u.role === 'admin'
                        ? 'bg-cyan-100 text-cyan-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {u.role === 'admin' ? (
                      <ShieldCheck className="h-5 w-5" />
                    ) : (
                      <UserCircle className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${
                          u.role === 'admin'
                            ? 'border-cyan-200 text-cyan-700'
                            : 'border-gray-200 text-gray-500'
                        }`}
                      >
                        {u.role}
                      </Badge>
                      {!u.active && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-red-200 text-red-500">
                          disabled
                        </Badge>
                      )}
                      {u.id === currentUser?.id && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-sky-200 text-sky-600">
                          you
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">@{u.username}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggleActive(u)}
                      title={u.active ? 'Disable user' : 'Enable user'}
                    >
                      {u.active ? (
                        <Shield className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Shield className="h-4 w-4 text-red-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(u)}
                    >
                      <Pencil className="h-4 w-4 text-gray-400" />
                    </Button>
                    {u.id !== currentUser?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setDeleteUser(u)}
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit User' : 'Create New User'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="form_username">Username</Label>
              <Input
                id="form_username"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                placeholder="e.g. john"
                disabled={!!editingUser}
                autoComplete="off"
              />
              {editingUser && (
                <p className="text-xs text-gray-400">Username cannot be changed</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="form_name">Full Name</Label>
              <Input
                id="form_name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. John Doe"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={formRole} onValueChange={(v) => setFormRole(v as 'admin' | 'staff')}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-cyan-600" />
                      <span>Admin — Full access, user management</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="staff">
                    <div className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4 text-gray-500" />
                      <span>Staff — Limited access, no settings</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="form_password">
                Password {editingUser ? '(leave blank to keep current)' : ''}
              </Label>
              <div className="relative">
                <Input
                  id="form_password"
                  type={showPassword ? 'text' : 'password'}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={editingUser ? 'Leave blank to keep current password' : 'Min 4 characters'}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {!editingUser && formPassword.length > 0 && formPassword.length < 4 && (
                <p className="text-xs text-red-500">Password must be at least 4 characters</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveUser}
              disabled={saving}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingUser ? (
                'Update User'
              ) : (
                'Create User'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteUser?.name}</strong> (@{deleteUser?.username})?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
