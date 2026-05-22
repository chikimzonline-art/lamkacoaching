'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  Users,
  Clock,
  FileText,
  Plus,
  Pencil,
  Trash2,
  Save,
  Loader2,
  GripVertical,
  Eye,
  EyeOff,
  Target,
  Camera,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────
interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  initials: string;
  color: string;
  sortOrder: number;
  active: boolean;
}

interface Milestone {
  id: string;
  year: string;
  event: string;
  sortOrder: number;
}

interface CampusGalleryItem {
  id: string;
  title: string;
  description: string;
  image: string;
  colSpan: string;
  rowSpan: string;
  sortOrder: number;
  active: boolean;
}

interface AboutSettings {
  about_story: string;
  about_story_extra: string;
  about_story_closing: string;
  about_mission: string;
  about_vision: string;
}

const defaultSettings: AboutSettings = {
  about_story: '',
  about_story_extra: '',
  about_story_closing: '',
  about_mission: '',
  about_vision: '',
};

const colorOptions = [
  { value: 'from-cyan-500 to-sky-500', label: 'Cyan-Sky', preview: 'bg-gradient-to-r from-cyan-500 to-sky-500' },
  { value: 'from-blue-500 to-indigo-500', label: 'Blue-Indigo', preview: 'bg-gradient-to-r from-blue-500 to-indigo-500' },
  { value: 'from-cyan-500 to-teal-500', label: 'Cyan-Teal', preview: 'bg-gradient-to-r from-cyan-500 to-teal-500' },
  { value: 'from-purple-500 to-violet-500', label: 'Purple-Violet', preview: 'bg-gradient-to-r from-purple-500 to-violet-500' },
  { value: 'from-green-500 to-emerald-500', label: 'Green-Emerald', preview: 'bg-gradient-to-r from-green-500 to-emerald-500' },
  { value: 'from-orange-500 to-amber-500', label: 'Orange-Amber', preview: 'bg-gradient-to-r from-orange-500 to-amber-500' },
  { value: 'from-rose-500 to-pink-500', label: 'Rose-Pink', preview: 'bg-gradient-to-r from-rose-500 to-pink-500' },
  { value: 'from-red-500 to-orange-500', label: 'Red-Orange', preview: 'bg-gradient-to-r from-red-500 to-orange-500' },
];

type TabType = 'content' | 'team' | 'milestones' | 'gallery';

export default function AboutView() {
  const [activeTab, setActiveTab] = useState<TabType>('content');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [galleryItems, setGalleryItems] = useState<CampusGalleryItem[]>([]);
  const [settings, setSettings] = useState<AboutSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Team member dialog
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deleteMember, setDeleteMember] = useState<TeamMember | null>(null);

  // Milestone dialog
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [deleteMilestone, setDeleteMilestone] = useState<Milestone | null>(null);

  // Gallery dialog
  const [galleryDialogOpen, setGalleryDialogOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState<CampusGalleryItem | null>(null);
  const [deleteGallery, setDeleteGallery] = useState<CampusGalleryItem | null>(null);

  // Form state - Team
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formInitials, setFormInitials] = useState('');
  const [formColor, setFormColor] = useState('from-cyan-500 to-sky-500');
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formActive, setFormActive] = useState(true);

  // Form state - Milestone
  const [formYear, setFormYear] = useState('');
  const [formEvent, setFormEvent] = useState('');
  const [formMilestoneSort, setFormMilestoneSort] = useState(0);

  // Form state - Gallery
  const [formGalleryTitle, setFormGalleryTitle] = useState('');
  const [formGalleryDesc, setFormGalleryDesc] = useState('');
  const [formGalleryImage, setFormGalleryImage] = useState('');
  const [formGalleryColSpan, setFormGalleryColSpan] = useState('');
  const [formGalleryRowSpan, setFormGalleryRowSpan] = useState('');
  const [formGallerySort, setFormGallerySort] = useState(0);
  const [formGalleryActive, setFormGalleryActive] = useState(true);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/about');
      if (res.ok) {
        const data = await res.json();
        setTeamMembers(data.teamMembers || []);
        setMilestones(data.milestones || []);
        setGalleryItems(data.galleryItems || []);
        setSettings({
          about_story: data.settings?.about_story || '',
          about_story_extra: data.settings?.about_story_extra || '',
          about_story_closing: data.settings?.about_story_closing || '',
          about_mission: data.settings?.about_mission || '',
          about_vision: data.settings?.about_vision || '',
        });
      }
    } catch {
      toast.error('Failed to fetch about data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Settings Save ──────────────────────────────────
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/about', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'settings', data: settings }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to save');
        return;
      }
      toast.success('About page content saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // ─── Team Member CRUD ───────────────────────────────
  const resetTeamForm = () => {
    setFormName('');
    setFormRole('');
    setFormBio('');
    setFormInitials('');
    setFormColor('from-cyan-500 to-sky-500');
    setFormSortOrder(teamMembers.length);
    setFormActive(true);
    setEditingMember(null);
  };

  const openCreateMember = () => {
    resetTeamForm();
    setTeamDialogOpen(true);
  };

  const openEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setFormName(member.name);
    setFormRole(member.role);
    setFormBio(member.bio);
    setFormInitials(member.initials);
    setFormColor(member.color);
    setFormSortOrder(member.sortOrder);
    setFormActive(member.active);
    setTeamDialogOpen(true);
  };

  const handleSaveMember = async () => {
    if (!formName.trim() || !formRole.trim() || !formBio.trim()) {
      toast.error('Name, role, and bio are required');
      return;
    }

    setSaving(true);
    try {
      if (editingMember) {
        const res = await fetch('/api/about', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'teamMember',
            action: 'update',
            id: editingMember.id,
            data: { name: formName.trim(), role: formRole.trim(), bio: formBio.trim(), initials: formInitials.trim() || formName.trim().substring(0, 2).toUpperCase(), color: formColor, sortOrder: formSortOrder, active: formActive },
          }),
        });
        if (!res.ok) { toast.error('Failed to update'); return; }
        toast.success('Team member updated');
      } else {
        const res = await fetch('/api/about', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'teamMember',
            action: 'create',
            data: { name: formName.trim(), role: formRole.trim(), bio: formBio.trim(), initials: formInitials.trim() || formName.trim().split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase(), color: formColor, sortOrder: formSortOrder, active: formActive },
          }),
        });
        if (!res.ok) { toast.error('Failed to create'); return; }
        toast.success('Team member added');
      }
      setTeamDialogOpen(false);
      resetTeamForm();
      fetchData();
    } catch {
      toast.error('Failed to save team member');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!deleteMember) return;
    try {
      const res = await fetch('/api/about', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'teamMember', action: 'delete', id: deleteMember.id }),
      });
      if (!res.ok) { toast.error('Failed to delete'); return; }
      toast.success('Team member deleted');
      setDeleteMember(null);
      fetchData();
    } catch {
      toast.error('Failed to delete team member');
    }
  };

  // ─── Milestone CRUD ─────────────────────────────────
  const resetMilestoneForm = () => {
    setFormYear('');
    setFormEvent('');
    setFormMilestoneSort(milestones.length);
    setEditingMilestone(null);
  };

  const openCreateMilestone = () => {
    resetMilestoneForm();
    setMilestoneDialogOpen(true);
  };

  const openEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setFormYear(milestone.year);
    setFormEvent(milestone.event);
    setFormMilestoneSort(milestone.sortOrder);
    setMilestoneDialogOpen(true);
  };

  const handleSaveMilestone = async () => {
    if (!formYear.trim() || !formEvent.trim()) {
      toast.error('Year and event are required');
      return;
    }

    setSaving(true);
    try {
      if (editingMilestone) {
        const res = await fetch('/api/about', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'milestone',
            action: 'update',
            id: editingMilestone.id,
            data: { year: formYear.trim(), event: formEvent.trim(), sortOrder: formMilestoneSort },
          }),
        });
        if (!res.ok) { toast.error('Failed to update'); return; }
        toast.success('Milestone updated');
      } else {
        const res = await fetch('/api/about', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'milestone',
            action: 'create',
            data: { year: formYear.trim(), event: formEvent.trim(), sortOrder: formMilestoneSort },
          }),
        });
        if (!res.ok) { toast.error('Failed to create'); return; }
        toast.success('Milestone added');
      }
      setMilestoneDialogOpen(false);
      resetMilestoneForm();
      fetchData();
    } catch {
      toast.error('Failed to save milestone');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMilestone = async () => {
    if (!deleteMilestone) return;
    try {
      const res = await fetch('/api/about', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'milestone', action: 'delete', id: deleteMilestone.id }),
      });
      if (!res.ok) { toast.error('Failed to delete'); return; }
      toast.success('Milestone deleted');
      setDeleteMilestone(null);
      fetchData();
    } catch {
      toast.error('Failed to delete milestone');
    }
  };

  // ─── Gallery CRUD ───────────────────────────────────
  const resetGalleryForm = () => {
    setFormGalleryTitle('');
    setFormGalleryDesc('');
    setFormGalleryImage('');
    setFormGalleryColSpan('');
    setFormGalleryRowSpan('');
    setFormGallerySort(galleryItems.length);
    setFormGalleryActive(true);
    setEditingGallery(null);
  };

  const openCreateGallery = () => {
    resetGalleryForm();
    setGalleryDialogOpen(true);
  };

  const openEditGallery = (item: CampusGalleryItem) => {
    setEditingGallery(item);
    setFormGalleryTitle(item.title);
    setFormGalleryDesc(item.description);
    setFormGalleryImage(item.image);
    setFormGalleryColSpan(item.colSpan);
    setFormGalleryRowSpan(item.rowSpan);
    setFormGallerySort(item.sortOrder);
    setFormGalleryActive(item.active);
    setGalleryDialogOpen(true);
  };

  const handleSaveGallery = async () => {
    if (!formGalleryTitle.trim() || !formGalleryImage.trim()) {
      toast.error('Title and image path are required');
      return;
    }

    setSaving(true);
    try {
      if (editingGallery) {
        const res = await fetch('/api/about', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'campusGallery',
            action: 'update',
            id: editingGallery.id,
            data: {
              title: formGalleryTitle.trim(),
              description: formGalleryDesc.trim(),
              image: formGalleryImage.trim(),
              colSpan: formGalleryColSpan,
              rowSpan: formGalleryRowSpan,
              sortOrder: formGallerySort,
              active: formGalleryActive,
            },
          }),
        });
        if (!res.ok) { toast.error('Failed to update'); return; }
        toast.success('Gallery item updated');
      } else {
        const res = await fetch('/api/about', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'campusGallery',
            action: 'create',
            data: {
              title: formGalleryTitle.trim(),
              description: formGalleryDesc.trim(),
              image: formGalleryImage.trim(),
              colSpan: formGalleryColSpan,
              rowSpan: formGalleryRowSpan,
              sortOrder: formGallerySort,
              active: formGalleryActive,
            },
          }),
        });
        if (!res.ok) { toast.error('Failed to create'); return; }
        toast.success('Gallery item added');
      }
      setGalleryDialogOpen(false);
      resetGalleryForm();
      fetchData();
    } catch {
      toast.error('Failed to save gallery item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGallery = async () => {
    if (!deleteGallery) return;
    try {
      const res = await fetch('/api/about', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'campusGallery', action: 'delete', id: deleteGallery.id }),
      });
      if (!res.ok) { toast.error('Failed to delete'); return; }
      toast.success('Gallery item deleted');
      setDeleteGallery(null);
      fetchData();
    } catch {
      toast.error('Failed to delete gallery item');
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size: 5MB');
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error('Invalid file type. Allowed: PNG, JPEG, SVG, WebP, GIF');
      return;
    }

    setUploadingGallery(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'gallery');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Failed to upload image');
        return;
      }

      setFormGalleryImage(json.url);
      toast.success('Image uploaded successfully');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploadingGallery(false);
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'content', label: 'Page Content', icon: <FileText className="h-4 w-4" /> },
    { key: 'team', label: 'Team Members', icon: <Users className="h-4 w-4" /> },
    { key: 'milestones', label: 'Milestones', icon: <Clock className="h-4 w-4" /> },
    { key: 'gallery', label: 'Campus Gallery', icon: <Camera className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-cyan-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.key === 'team' && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">
                {teamMembers.length}
              </Badge>
            )}
            {tab.key === 'milestones' && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">
                {milestones.length}
              </Badge>
            )}
            {tab.key === 'gallery' && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">
                {galleryItems.length}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* ─── Content Tab ──────────────────────────────── */}
      {activeTab === 'content' && (
        <div className="space-y-6 max-w-2xl">
          {/* Our Story */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-600" />
                Our Story
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Main Paragraph</Label>
                <Textarea
                  value={settings.about_story}
                  onChange={(e) => setSettings({ ...settings, about_story: e.target.value })}
                  placeholder="The main story paragraph about the center..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Second Paragraph</Label>
                <Textarea
                  value={settings.about_story_extra}
                  onChange={(e) => setSettings({ ...settings, about_story_extra: e.target.value })}
                  placeholder="Additional details about programs and services..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Closing Paragraph</Label>
                <Textarea
                  value={settings.about_story_closing}
                  onChange={(e) => setSettings({ ...settings, about_story_closing: e.target.value })}
                  placeholder="Closing paragraph about the team and results..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Mission & Vision */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-cyan-600" />
                Mission & Vision
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Our Mission</Label>
                <Textarea
                  value={settings.about_mission}
                  onChange={(e) => setSettings({ ...settings, about_mission: e.target.value })}
                  placeholder="The mission statement..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Our Vision</Label>
                <Textarea
                  value={settings.about_vision}
                  onChange={(e) => setSettings({ ...settings, about_vision: e.target.value })}
                  placeholder="The vision statement..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              className="bg-cyan-600 hover:bg-cyan-700 px-8"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Content'}
            </Button>
          </div>
        </div>
      )}

      {/* ─── Team Members Tab ─────────────────────────── */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Manage team members displayed on the About Us page</p>
            <Button onClick={openCreateMember} size="sm" className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Member
            </Button>
          </div>

          {teamMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No team members yet</p>
              <Button onClick={openCreateMember} variant="outline" size="sm" className="mt-3">
                Add your first team member
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {teamMembers.map((member) => (
                <Card key={member.id} className={`border-0 shadow-sm ${!member.active ? 'opacity-50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${member.color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                        {member.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">{member.name}</p>
                          <Badge variant="outline" className="text-[10px] px-1.5 border-cyan-200 text-cyan-700">
                            {member.role}
                          </Badge>
                          {!member.active && (
                            <Badge variant="outline" className="text-[10px] px-1.5 border-red-200 text-red-500">
                              Hidden
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{member.bio}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={async () => {
                            await fetch('/api/about', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                type: 'teamMember',
                                action: 'update',
                                id: member.id,
                                data: { ...member, active: !member.active },
                              }),
                            });
                            fetchData();
                          }}
                          title={member.active ? 'Hide from page' : 'Show on page'}
                        >
                          {member.active ? <Eye className="h-4 w-4 text-gray-400" /> : <EyeOff className="h-4 w-4 text-red-400" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditMember(member)}>
                          <Pencil className="h-4 w-4 text-gray-400" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteMember(member)}>
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Milestones Tab ───────────────────────────── */}
      {activeTab === 'milestones' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Manage the timeline milestones on the About Us page</p>
            <Button onClick={openCreateMilestone} size="sm" className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Milestone
            </Button>
          </div>

          {milestones.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No milestones yet</p>
              <Button onClick={openCreateMilestone} variant="outline" size="sm" className="mt-3">
                Add your first milestone
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {milestones.map((milestone) => (
                <Card key={milestone.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Badge className="bg-cyan-100 text-cyan-700 text-sm font-bold shrink-0 mt-0.5">
                        {milestone.year}
                      </Badge>
                      <p className="text-sm text-gray-600 flex-1 leading-relaxed">{milestone.event}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditMilestone(milestone)}>
                          <Pencil className="h-4 w-4 text-gray-400" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteMilestone(milestone)}>
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Campus Gallery Tab ─────────────────────────── */}
      {activeTab === 'gallery' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Manage the campus gallery images on the About Us page</p>
            <Button onClick={openCreateGallery} size="sm" className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Image
            </Button>
          </div>

          {galleryItems.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No gallery items yet</p>
              <Button onClick={openCreateGallery} variant="outline" size="sm" className="mt-3">
                Add your first gallery image
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {galleryItems.map((item) => (
                <Card key={item.id} className={`border-0 shadow-sm ${!item.active ? 'opacity-50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                        ) : (
                          <Camera className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                          {item.colSpan && (
                            <Badge variant="outline" className="text-[10px] px-1.5 border-cyan-200 text-cyan-700">
                              Wide
                            </Badge>
                          )}
                          {item.rowSpan && (
                            <Badge variant="outline" className="text-[10px] px-1.5 border-emerald-200 text-emerald-700">
                              Tall
                            </Badge>
                          )}
                          {!item.active && (
                            <Badge variant="outline" className="text-[10px] px-1.5 border-red-200 text-red-500">
                              Hidden
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.description}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{item.image}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={async () => {
                            await fetch('/api/about', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                type: 'campusGallery',
                                action: 'update',
                                id: item.id,
                                data: { ...item, active: !item.active },
                              }),
                            });
                            fetchData();
                          }}
                          title={item.active ? 'Hide from page' : 'Show on page'}
                        >
                          {item.active ? <Eye className="h-4 w-4 text-gray-400" /> : <EyeOff className="h-4 w-4 text-red-400" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditGallery(item)}>
                          <Pencil className="h-4 w-4 text-gray-400" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteGallery(item)}>
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Team Member Dialog ───────────────────────── */}
      <Dialog open={teamDialogOpen} onOpenChange={(open) => { setTeamDialogOpen(open); if (!open) resetTeamForm(); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMember ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. John Doe" />
              </div>
              <div className="space-y-2">
                <Label>Role / Title</Label>
                <Input value={formRole} onChange={(e) => setFormRole(e.target.value)} placeholder="e.g. Head of Academics" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={formBio} onChange={(e) => setFormBio(e.target.value)} placeholder="Brief description about this person..." rows={3} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Initials</Label>
                <Input value={formInitials} onChange={(e) => setFormInitials(e.target.value)} placeholder="e.g. JD" maxLength={3} />
                <p className="text-xs text-gray-400">Auto-generated from name if left empty</p>
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input type="number" value={formSortOrder} onChange={(e) => setFormSortOrder(parseInt(e.target.value) || 0)} min={0} />
              </div>
              <div className="space-y-2">
                <Label>Visible</Label>
                <Select value={formActive ? 'true' : 'false'} onValueChange={(v) => setFormActive(v === 'true')}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Visible</SelectItem>
                    <SelectItem value="false">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Avatar Color</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormColor(option.value)}
                    className={`h-9 w-9 rounded-lg ${option.preview} transition-all ${
                      formColor === option.value ? 'ring-2 ring-cyan-600 ring-offset-2 scale-110' : 'hover:scale-105'
                    }`}
                    title={option.label}
                  />
                ))}
              </div>
            </div>
            {/* Preview */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Preview</p>
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${formColor} flex items-center justify-center text-white font-bold text-sm`}>
                  {formInitials || formName.split(' ').map(w => w[0] || '').join('').substring(0, 2).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{formName || 'Name'}</p>
                  <p className="text-xs text-cyan-600">{formRole || 'Role'}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setTeamDialogOpen(false); resetTeamForm(); }}>Cancel</Button>
            <Button onClick={handleSaveMember} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingMember ? 'Update' : 'Add Member'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Milestone Dialog ─────────────────────────── */}
      <Dialog open={milestoneDialogOpen} onOpenChange={(open) => { setMilestoneDialogOpen(open); if (!open) resetMilestoneForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMilestone ? 'Edit Milestone' : 'Add Milestone'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Year</Label>
                <Input value={formYear} onChange={(e) => setFormYear(e.target.value)} placeholder="e.g. 2024" maxLength={4} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Sort Order</Label>
                <Input type="number" value={formMilestoneSort} onChange={(e) => setFormMilestoneSort(parseInt(e.target.value) || 0)} min={0} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Event Description</Label>
              <Textarea value={formEvent} onChange={(e) => setFormEvent(e.target.value)} placeholder="Describe what happened this year..." rows={3} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setMilestoneDialogOpen(false); resetMilestoneForm(); }}>Cancel</Button>
            <Button onClick={handleSaveMilestone} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingMilestone ? 'Update' : 'Add Milestone'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Team Member Confirmation ──────────── */}
      <AlertDialog open={!!deleteMember} onOpenChange={() => setDeleteMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deleteMember?.name}</strong> from the team? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMember} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Delete Milestone Confirmation ────────────── */}
      <AlertDialog open={!!deleteMilestone} onOpenChange={() => setDeleteMilestone(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Milestone</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the <strong>{deleteMilestone?.year}</strong> milestone? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMilestone} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Gallery Item Dialog ────────────────────────── */}
      <Dialog open={galleryDialogOpen} onOpenChange={(open) => { setGalleryDialogOpen(open); if (!open) resetGalleryForm(); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGallery ? 'Edit Gallery Image' : 'Add Gallery Image'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={formGalleryTitle} onChange={(e) => setFormGalleryTitle(e.target.value)} placeholder="e.g. Computer Lab" />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input type="number" value={formGallerySort} onChange={(e) => setFormGallerySort(parseInt(e.target.value) || 0)} min={0} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formGalleryDesc} onChange={(e) => setFormGalleryDesc(e.target.value)} placeholder="Brief description of this image..." rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              <div className="flex gap-2">
                <Input
                  value={formGalleryImage}
                  onChange={(e) => setFormGalleryImage(e.target.value)}
                  placeholder="/gallery/gallery-computer-lab.jpg or Vercel Blob URL"
                  className="flex-1"
                />
                <label className="cursor-pointer shrink-0">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp,image/gif"
                    onChange={handleGalleryUpload}
                    className="hidden"
                    disabled={uploadingGallery}
                  />
                  <span className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg text-sm font-medium transition-all bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100 hover:border-cyan-300">
                    {uploadingGallery ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload File
                      </>
                    )}
                  </span>
                </label>
              </div>
              <p className="text-xs text-gray-400">Upload an image file directly or paste an image URL.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Column Span</Label>
                <Select value={formGalleryColSpan || 'none'} onValueChange={(v) => setFormGalleryColSpan(v === 'none' ? '' : v)}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Default (1 column)</SelectItem>
                    <SelectItem value="md:col-span-2">Wide (2 columns)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Row Span</Label>
                <Select value={formGalleryRowSpan || 'none'} onValueChange={(v) => setFormGalleryRowSpan(v === 'none' ? '' : v)}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Default (1 row)</SelectItem>
                    <SelectItem value="md:row-span-2">Tall (2 rows)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={formGalleryActive ? 'true' : 'false'} onValueChange={(v) => setFormGalleryActive(v === 'true')}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Visible</SelectItem>
                  <SelectItem value="false">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Preview */}
            {formGalleryImage && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-400 mb-2">Image Preview</p>
                <div className="h-32 rounded-lg overflow-hidden bg-gray-200">
                  <img src={formGalleryImage} alt={formGalleryTitle} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{formGalleryTitle || 'Untitled'} {formGalleryColSpan && '(Wide)'} {formGalleryRowSpan && '(Tall)'}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setGalleryDialogOpen(false); resetGalleryForm(); }}>Cancel</Button>
            <Button onClick={handleSaveGallery} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingGallery ? 'Update' : 'Add Image'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Gallery Item Confirmation ──────────── */}
      <AlertDialog open={!!deleteGallery} onOpenChange={() => setDeleteGallery(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Gallery Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deleteGallery?.title}</strong> from the campus gallery? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGallery} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
