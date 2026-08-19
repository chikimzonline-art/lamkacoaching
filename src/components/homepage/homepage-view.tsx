'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus, Pencil, Trash2, Trophy, User, LayoutGrid, GraduationCap,
  Monitor, DoorOpen, BookOpen, Users, Flame, Star, Target,
  Lightbulb, Laptop, Award, Library, Building, Upload, X, ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';

/* ─── Icon Registry ─── */
const ICON_OPTIONS: { label: string; value: string }[] = [
  { label: 'Graduation Cap', value: 'GraduationCap' },
  { label: 'Monitor / PC', value: 'Monitor' },
  { label: 'Door Open', value: 'DoorOpen' },
  { label: 'Book Open', value: 'BookOpen' },
  { label: 'Users / Group', value: 'Users' },
  { label: 'Flame', value: 'Flame' },
  { label: 'Star', value: 'Star' },
  { label: 'Target', value: 'Target' },
  { label: 'Lightbulb', value: 'Lightbulb' },
  { label: 'Laptop', value: 'Laptop' },
  { label: 'Award', value: 'Award' },
  { label: 'Library', value: 'Library' },
  { label: 'Building', value: 'Building' },
];

export function resolveIcon(name: string, className?: string): React.ReactElement {
  const cls = className || 'h-6 w-6 text-white stroke-[2]';
  const map: Record<string, React.ReactElement> = {
    GraduationCap: <GraduationCap className={cls} />,
    Monitor: <Monitor className={cls} />,
    DoorOpen: <DoorOpen className={cls} />,
    BookOpen: <BookOpen className={cls} />,
    Users: <Users className={cls} />,
    Flame: <Flame className={cls} />,
    Star: <Star className={cls} />,
    Target: <Target className={cls} />,
    Lightbulb: <Lightbulb className={cls} />,
    Laptop: <Laptop className={cls} />,
    Award: <Award className={cls} />,
    Library: <Library className={cls} />,
    Building: <Building className={cls} />,
  };
  return map[name] ?? <GraduationCap className={cls} />;
}

/* ─── Types ─── */
interface SuccessStory {
  id?: string;
  name: string;
  achievement: string;
  batch: string;
  sortOrder: number;
  active: boolean;
}

interface FeatureCard {
  id?: string;
  title: string;
  description: string;
  image: string;
  icon: string;
  linkText: string;
  linkHref: string;
  sortOrder: number;
  active: boolean;
}

const defaultCard: FeatureCard = {
  title: '',
  description: '',
  image: '',
  icon: 'GraduationCap',
  linkText: 'Learn More',
  linkHref: '/',
  sortOrder: 0,
  active: true,
};

/* ═══════════════════════════════════════════
   SUCCESS STORIES SECTION
═══════════════════════════════════════════ */
function SuccessStoriesSection() {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SuccessStory | null>(null);
  const [formData, setFormData] = useState<Partial<SuccessStory>>({
    name: '', achievement: '', batch: '', sortOrder: 0, active: true,
  });

  const fetchStories = async () => {
    try {
      const res = await fetch('/api/stories');
      const data = await res.json();
      setStories(data.stories || []);
    } catch (error) {
      console.error('Error fetching success stories:', error);
      toast.error('Failed to load success stories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStories(); }, []);

  const openDialog = (item?: SuccessStory) => {
    if (item) {
      setEditingItem(item);
      setFormData({ ...item });
    } else {
      setEditingItem(null);
      setFormData({ name: '', achievement: '', batch: '', sortOrder: stories.length, active: true });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name?.trim() || !formData.achievement?.trim() || !formData.batch?.trim()) {
      toast.error('Name, achievement, and batch are required');
      return;
    }
    const isEditing = Boolean(editingItem?.id);
    try {
      const res = await fetch('/api/stories', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEditing ? { id: editingItem!.id, ...formData } : formData),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to save'); }
      toast.success(isEditing ? 'Updated successfully' : 'Created successfully');
      setDialogOpen(false);
      fetchStories();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this success story?')) return;
    try {
      const res = await fetch(`/api/stories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Deleted successfully');
      fetchStories();
    } catch { toast.error('Failed to delete'); }
  };

  const handleToggleActive = async (item: SuccessStory) => {
    if (!item.id) return;
    try {
      const res = await fetch('/api/stories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, active: !item.active }),
      });
      if (!res.ok) throw new Error('Failed to update');
      fetchStories();
    } catch { toast.error('Failed to update'); }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <Trophy className="h-5 w-5 text-cyan-600" />
                Our Success Stories
              </CardTitle>
              <CardDescription>
                Manage the student achievements shown in the carousel slider on the homepage.
              </CardDescription>
            </div>
            <Button onClick={() => openDialog()} className="bg-cyan-600 hover:bg-cyan-700 text-white gap-1.5 self-start sm:self-auto">
              <Plus className="h-4 w-4" /> Add Story
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-3">
        {stories.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <User className="h-10 w-10 mx-auto text-gray-400 mb-2 opacity-50" />
              <p className="font-medium">No success stories yet.</p>
              <p className="text-sm text-gray-400 mt-1">Click &ldquo;Add Story&rdquo; to create the first one.</p>
            </CardContent>
          </Card>
        ) : (
          stories.map((item) => (
            <Card key={item.id} className={`transition-opacity ${!item.active ? 'opacity-60' : ''}`}>
              <CardContent className="py-4 px-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-cyan-50 dark:bg-cyan-950/50 flex items-center justify-center border border-cyan-200 dark:border-cyan-800 shrink-0">
                      <User className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">{item.name}</h4>
                        <Badge variant="outline" className="text-xs border-cyan-300 text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/30">
                          {item.batch}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-cyan-600 dark:text-cyan-400 truncate mt-0.5">{item.achievement}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={item.active} onCheckedChange={() => handleToggleActive(item)} title={item.active ? 'Active' : 'Inactive'} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => item.id && handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Success Story' : 'Add Success Story'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Student Name *</Label>
              <Input id="name" value={formData.name || ''} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Rahul Sharma" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="achievement">Achievement *</Label>
              <Input id="achievement" value={formData.achievement || ''} onChange={(e) => setFormData((p) => ({ ...p, achievement: e.target.value }))} placeholder="e.g. SSC CGL 2023 - Income Tax Inspector" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="batch">Batch / Year *</Label>
              <Input id="batch" value={formData.batch || ''} onChange={(e) => setFormData((p) => ({ ...p, batch: e.target.value }))} placeholder="e.g. Batch of 2023" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input id="sortOrder" type="number" value={formData.sortOrder ?? 0} onChange={(e) => setFormData((p) => ({ ...p, sortOrder: parseInt(e.target.value, 10) || 0 }))} />
              </div>
              <div className="space-y-1.5 flex flex-col justify-end">
                <div className="flex items-center gap-2 pb-2">
                  <Switch id="active" checked={formData.active ?? true} onCheckedChange={(checked) => setFormData((p) => ({ ...p, active: checked }))} />
                  <Label htmlFor="active" className="cursor-pointer font-medium">Visible on site</Label>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-700 text-white">
              {editingItem ? 'Save Changes' : 'Create Story'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ═══════════════════════════════════════════
   FEATURE CARDS SECTION
═══════════════════════════════════════════ */
function FeatureCardsSection() {
  const [cards, setCards] = useState<FeatureCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FeatureCard | null>(null);
  const [formData, setFormData] = useState<FeatureCard>({ ...defaultCard });
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchCards = async () => {
    try {
      const res = await fetch('/api/feature-cards');
      const data = await res.json();
      setCards(data.cards || []);
    } catch (error) {
      console.error('Error fetching feature cards:', error);
      toast.error('Failed to load feature cards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCards(); }, []);

  const openDialog = (item?: FeatureCard) => {
    if (item) {
      setEditingItem(item);
      setFormData({ ...item });
    } else {
      setEditingItem(null);
      setFormData({ ...defaultCard, sortOrder: cards.length });
    }
    setDialogOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'feature-cards');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');
      setFormData((p) => ({ ...p, image: json.url }));
      toast.success('Image uploaded');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title?.trim() || !formData.description?.trim()) {
      toast.error('Title and description are required');
      return;
    }
    const isEditing = Boolean(editingItem?.id);
    try {
      const res = await fetch('/api/feature-cards', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEditing ? { id: editingItem!.id, ...formData } : formData),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to save'); }
      toast.success(isEditing ? 'Card updated' : 'Card created');
      setDialogOpen(false);
      fetchCards();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this feature card?')) return;
    try {
      const res = await fetch(`/api/feature-cards?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Deleted');
      fetchCards();
    } catch { toast.error('Failed to delete'); }
  };

  const handleToggleActive = async (item: FeatureCard) => {
    if (!item.id) return;
    try {
      const res = await fetch('/api/feature-cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, active: !item.active }),
      });
      if (!res.ok) throw new Error('Failed to update');
      fetchCards();
    } catch { toast.error('Failed to update'); }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <LayoutGrid className="h-5 w-5 text-cyan-600" />
                Feature Cards — &quot;Three Paths&quot; Section
              </CardTitle>
              <CardDescription>
                Manage the three background-image cards shown in the &quot;Three Paths. One Destination.&quot; section.
              </CardDescription>
            </div>
            <Button onClick={() => openDialog()} className="bg-cyan-600 hover:bg-cyan-700 text-white gap-1.5 self-start sm:self-auto">
              <Plus className="h-4 w-4" /> Add Card
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-3">
        {cards.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <LayoutGrid className="h-10 w-10 mx-auto text-gray-400 mb-2 opacity-50" />
              <p className="font-medium">No feature cards yet.</p>
              <p className="text-sm text-gray-400 mt-1">Click &ldquo;Add Card&rdquo; to create the first one.</p>
            </CardContent>
          </Card>
        ) : (
          cards.map((item) => (
            <Card key={item.id} className={`transition-opacity ${!item.active ? 'opacity-60' : ''}`}>
              <CardContent className="py-4 px-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Background image preview */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shrink-0 relative">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      {/* Icon overlay */}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="text-white scale-75">
                          {resolveIcon(item.icon)}
                        </div>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">{item.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{item.description}</p>
                      <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-0.5">
                        {item.linkText} → {item.linkHref}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={item.active} onCheckedChange={() => handleToggleActive(item)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => item.id && handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Feature Card' : 'Add Feature Card'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="fc-title">Title *</Label>
              <Input id="fc-title" value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Competitive Exam Coaching" />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="fc-desc">Description *</Label>
              <Textarea id="fc-desc" rows={3} value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} placeholder="Short description shown on the card." />
            </div>

            {/* Background Image */}
            <div className="space-y-1.5">
              <Label>Background Image</Label>
              {formData.image ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img src={formData.image} alt="Background" className="w-full h-36 object-cover" />
                  <button
                    onClick={() => setFormData((p) => ({ ...p, image: '' }))}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center gap-2 w-full h-28 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-cyan-400 transition-colors ${uploadingImage ? 'opacity-60 pointer-events-none' : ''}`}>
                  {uploadingImage ? (
                    <span className="text-sm text-gray-500">Uploading…</span>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-gray-400" />
                      <span className="text-sm text-gray-500">Click to upload background image</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
                </label>
              )}
            </div>

            {/* Icon Selector */}
            <div className="space-y-1.5">
              <Label>Icon</Label>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {ICON_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, icon: opt.value }))}
                    title={opt.label}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-xs font-medium ${formData.icon === opt.value ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300' : 'border-gray-200 dark:border-gray-700 hover:border-cyan-300 text-gray-500'}`}
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      {resolveIcon(opt.value, 'h-5 w-5')}
                    </span>
                    <span className="truncate w-full text-center" style={{ fontSize: '10px' }}>{opt.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Link */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fc-linkText">Button Text</Label>
                <Input id="fc-linkText" value={formData.linkText} onChange={(e) => setFormData((p) => ({ ...p, linkText: e.target.value }))} placeholder="e.g. Explore Courses" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fc-linkHref">Button URL</Label>
                <Input id="fc-linkHref" value={formData.linkHref} onChange={(e) => setFormData((p) => ({ ...p, linkHref: e.target.value }))} placeholder="e.g. /courses" />
              </div>
            </div>

            {/* Sort & Active */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fc-sortOrder">Sort Order</Label>
                <Input id="fc-sortOrder" type="number" value={formData.sortOrder} onChange={(e) => setFormData((p) => ({ ...p, sortOrder: parseInt(e.target.value, 10) || 0 }))} />
              </div>
              <div className="space-y-1.5 flex flex-col justify-end">
                <div className="flex items-center gap-2 pb-2">
                  <Switch id="fc-active" checked={formData.active} onCheckedChange={(checked) => setFormData((p) => ({ ...p, active: checked }))} />
                  <Label htmlFor="fc-active" className="cursor-pointer font-medium">Visible on site</Label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-700 text-white">
              {editingItem ? 'Save Changes' : 'Create Card'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ═══════════════════════════════════════════
   ROOT EXPORT
═══════════════════════════════════════════ */
export default function HomepageView() {
  return (
    <div className="space-y-10">
      {/* ─── Success Stories ─── */}
      <div className="space-y-6">
        <SuccessStoriesSection />
      </div>

      {/* ─── Feature Cards ─── */}
      <div className="space-y-6">
        <FeatureCardsSection />
      </div>
    </div>
  );
}
