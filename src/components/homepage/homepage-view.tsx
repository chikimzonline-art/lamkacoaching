'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Trophy, Quote, TrendingUp, Award, Star } from 'lucide-react';
import { toast } from 'sonner';

/* ─── Types ─── */
interface ImpactStat {
  id?: string;
  label: string;
  value: number;
  suffix: string;
  iconName: string;
  iconBg: string;
  iconColor: string;
  numberColor: string;
  sortOrder: number;
  active: boolean;
}

interface AchievementCard {
  id?: string;
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  barColor: string;
  sortOrder: number;
  active: boolean;
}

interface SuccessStory {
  id?: string;
  name: string;
  exam: string;
  quote: string;
  result: string;
  initials: string;
  gradient: string;
  sortOrder: number;
  active: boolean;
}

interface Testimonial {
  id?: string;
  name: string;
  course: string;
  badge: string;
  badgeColor: string;
  text: string;
  rating: number;
  avatar: string;
  gradient: string;
  sortOrder: number;
  active: boolean;
}

/* ─── Icon options ─── */
const iconOptions = [
  { value: 'GraduationCap', label: 'Graduation Cap' },
  { value: 'TrendingUp', label: 'Trending Up' },
  { value: 'Award', label: 'Award' },
  { value: 'Clock', label: 'Clock' },
  { value: 'Users', label: 'Users' },
  { value: 'BookOpen', label: 'Book' },
  { value: 'Target', label: 'Target' },
];

const colorPresets = [
  { value: 'bg-cyan-500/20', label: 'Cyan', colorClass: 'text-cyan-400' },
  { value: 'bg-green-500/20', label: 'Green', colorClass: 'text-green-400' },
  { value: 'bg-blue-500/20', label: 'Blue', colorClass: 'text-blue-400' },
  { value: 'bg-purple-500/20', label: 'Purple', colorClass: 'text-purple-400' },
  { value: 'bg-orange-500/20', label: 'Orange', colorClass: 'text-orange-400' },
  { value: 'bg-rose-500/20', label: 'Rose', colorClass: 'text-rose-400' },
];

const gradientOptions = [
  { value: 'from-cyan-500 to-sky-500', label: 'Cyan → Sky' },
  { value: 'from-blue-500 to-indigo-500', label: 'Blue → Indigo' },
  { value: 'from-green-500 to-emerald-500', label: 'Green → Emerald' },
  { value: 'from-purple-500 to-violet-500', label: 'Purple → Violet' },
  { value: 'from-orange-500 to-amber-500', label: 'Orange → Amber' },
  { value: 'from-rose-500 to-red-500', label: 'Rose → Red' },
  { value: 'from-teal-500 to-cyan-500', label: 'Teal → Cyan' },
  { value: 'from-emerald-500 to-green-500', label: 'Emerald → Green' },
];

const barColorOptions = [
  { value: 'from-cyan-500 to-sky-400', label: 'Cyan' },
  { value: 'from-green-500 to-emerald-400', label: 'Green' },
  { value: 'from-blue-500 to-indigo-400', label: 'Blue' },
  { value: 'from-purple-500 to-violet-400', label: 'Purple' },
];

/* ─── Reusable Editable List Component ─── */
function EditableList<T extends { id?: string; sortOrder: number; active: boolean }>({
  title,
  icon: Icon,
  items,
  onAdd,
  onEdit,
  onDelete,
  onToggleActive,
  renderCard,
}: {
  title: string;
  icon: React.ElementType;
  items: T[];
  onAdd: () => void;
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
  onToggleActive: (item: T) => void;
  renderCard: (item: T) => React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-cyan-600" />
          <h3 className="text-lg font-semibold">{title}</h3>
          <Badge variant="secondary" className="ml-2">{items.length}</Badge>
        </div>
        <Button onClick={onAdd} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Add New
        </Button>
      </div>
      <div className="space-y-3">
        {items.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No items yet. Click &ldquo;Add New&rdquo; to create one.
            </CardContent>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id} className={`transition-opacity ${!item.active ? 'opacity-60' : ''}`}>
              <CardContent className="py-3 px-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {renderCard(item)}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={item.active}
                      onCheckedChange={() => onToggleActive(item)}
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => item.id && onDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function HomepageView() {
  const [impactStats, setImpactStats] = useState<ImpactStat[]>([]);
  const [achievements, setAchievements] = useState<AchievementCard[]>([]);
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('impact');

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'impact' | 'achievement' | 'story' | 'testimonial'>('impact');
  const [editingItem, setEditingItem] = useState<ImpactStat | AchievementCard | SuccessStory | Testimonial | null>(null);

  // Form state
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  // Fetch all data
  const fetchData = async () => {
    try {
      const [statsRes, achRes, storRes, testRes] = await Promise.all([
        fetch('/api/impact-stats'),
        fetch('/api/achievements'),
        fetch('/api/stories'),
        fetch('/api/testimonials'),
      ]);
      const [statsData, achData, storData, testData] = await Promise.all([
        statsRes.json(),
        achRes.json(),
        storRes.json(),
        testRes.json(),
      ]);
      setImpactStats(statsData.stats || []);
      setAchievements(achData.achievements || []);
      setStories(storData.stories || []);
      setTestimonials(testData.testimonials || []);
    } catch (error) {
      console.error('Error fetching homepage data:', error);
      toast.error('Failed to load homepage data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Open dialog for add/edit
  const openDialog = (type: 'impact' | 'achievement' | 'story' | 'testimonial', item?: ImpactStat | AchievementCard | SuccessStory | Testimonial) => {
    setDialogType(type);
    if (item) {
      setEditingItem(item);
      setFormData({ ...item });
    } else {
      setEditingItem(null);
      // Set defaults based on type
      switch (type) {
        case 'impact':
          setFormData({ label: '', value: 0, suffix: '+', iconName: 'GraduationCap', iconBg: 'bg-cyan-500/20', iconColor: 'text-cyan-400', numberColor: 'text-cyan-400', sortOrder: 0, active: true });
          break;
        case 'achievement':
          setFormData({ badge: '', badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', title: '', description: '', barColor: 'from-cyan-500 to-sky-400', sortOrder: 0, active: true });
          break;
        case 'story':
          setFormData({ name: '', exam: '', quote: '', result: '', initials: '', gradient: 'from-cyan-500 to-sky-500', sortOrder: 0, active: true });
          break;
        case 'testimonial':
          setFormData({ name: '', course: '', badge: '', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', text: '', rating: 5, avatar: '', gradient: 'from-cyan-500 to-teal-500', sortOrder: 0, active: true });
          break;
      }
    }
    setDialogOpen(true);
  };

  // Save (create or update)
  const handleSave = async () => {
    const endpoints: Record<string, string> = {
      impact: '/api/impact-stats',
      achievement: '/api/achievements',
      story: '/api/stories',
      testimonial: '/api/testimonials',
    };

    const endpoint = endpoints[dialogType];
    const isEditing = editingItem && (editingItem as { id?: string }).id;

    // Auto-generate initials/avatar if not provided
    const name = (formData.name as string) || '';
    if (dialogType === 'story' && !formData.initials && name) {
      formData.initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
    }
    if (dialogType === 'testimonial' && !formData.avatar && name) {
      formData.avatar = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
    }
    if (dialogType === 'testimonial' && !formData.badge) {
      formData.badge = formData.course;
    }

    try {
      const res = await fetch(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEditing ? { id: (editingItem as { id?: string }).id, ...formData } : formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      toast.success(isEditing ? 'Updated successfully' : 'Created successfully');
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save');
    }
  };

  // Delete
  const handleDelete = async (type: 'impact' | 'achievement' | 'story' | 'testimonial', id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    const endpoints: Record<string, string> = {
      impact: `/api/impact-stats/${id}`,
      achievement: `/api/achievements/${id}`,
      story: `/api/stories/${id}`,
      testimonial: `/api/testimonials/${id}`,
    };

    try {
      const res = await fetch(endpoints[type], { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  // Toggle active
  const handleToggleActive = async (type: 'impact' | 'achievement' | 'story' | 'testimonial', item: ImpactStat | AchievementCard | SuccessStory | Testimonial) => {
    const endpoints: Record<string, string> = {
      impact: '/api/impact-stats',
      achievement: '/api/achievements',
      story: '/api/stories',
      testimonial: '/api/testimonials',
    };

    try {
      const res = await fetch(endpoints[type], {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: (item as { id?: string }).id, active: !item.active }),
      });
      if (!res.ok) throw new Error('Failed to update');
      fetchData();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  // Update form field
  const updateField = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  /* ─── Render Dialog Form based on type ─── */
  const renderDialogForm = () => {
    switch (dialogType) {
      case 'impact':
        return (
          <div className="space-y-4">
            <div>
              <Label>Label *</Label>
              <Input value={(formData.label as string) || ''} onChange={(e) => updateField('label', e.target.value)} placeholder="e.g. Students Trained" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Value *</Label>
                <Input type="number" value={(formData.value as number) || 0} onChange={(e) => updateField('value', parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <Label>Suffix</Label>
                <Input value={(formData.suffix as string) || ''} onChange={(e) => updateField('suffix', e.target.value)} placeholder="e.g. + or %+" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Icon</Label>
                <Select value={(formData.iconName as string) || 'GraduationCap'} onValueChange={(v) => updateField('iconName', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input type="number" value={(formData.sortOrder as number) || 0} onChange={(e) => updateField('sortOrder', parseInt(e.target.value) || 0)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Icon BG</Label>
                <Select value={(formData.iconBg as string) || 'bg-cyan-500/20'} onValueChange={(v) => updateField('iconBg', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {colorPresets.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Icon Color</Label>
                <Input value={(formData.iconColor as string) || ''} onChange={(e) => updateField('iconColor', e.target.value)} placeholder="text-cyan-400" />
              </div>
              <div>
                <Label>Number Color</Label>
                <Input value={(formData.numberColor as string) || ''} onChange={(e) => updateField('numberColor', e.target.value)} placeholder="text-cyan-400" />
              </div>
            </div>
          </div>
        );

      case 'achievement':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Badge Text *</Label>
                <Input value={(formData.badge as string) || ''} onChange={(e) => updateField('badge', e.target.value)} placeholder="e.g. Latest Result" />
              </div>
              <div>
                <Label>Title *</Label>
                <Input value={(formData.title as string) || ''} onChange={(e) => updateField('title', e.target.value)} placeholder="e.g. SSC CGL 2024" />
              </div>
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea value={(formData.description as string) || ''} onChange={(e) => updateField('description', e.target.value)} placeholder="Describe the achievement..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Badge Color Class</Label>
                <Input value={(formData.badgeColor as string) || ''} onChange={(e) => updateField('badgeColor', e.target.value)} placeholder="bg-cyan-500/10 text-cyan-400 border-cyan-500/20" />
              </div>
              <div>
                <Label>Progress Bar Color</Label>
                <Select value={(formData.barColor as string) || 'from-cyan-500 to-sky-400'} onValueChange={(v) => updateField('barColor', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {barColorOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input type="number" value={(formData.sortOrder as number) || 0} onChange={(e) => updateField('sortOrder', parseInt(e.target.value) || 0)} />
            </div>
          </div>
        );

      case 'story':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input value={(formData.name as string) || ''} onChange={(e) => updateField('name', e.target.value)} placeholder="Student name" />
              </div>
              <div>
                <Label>Exam *</Label>
                <Input value={(formData.exam as string) || ''} onChange={(e) => updateField('exam', e.target.value)} placeholder="e.g. SSC CGL 2024" />
              </div>
            </div>
            <div>
              <Label>Quote *</Label>
              <Textarea value={(formData.quote as string) || ''} onChange={(e) => updateField('quote', e.target.value)} placeholder="Student testimonial quote..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Result *</Label>
                <Input value={(formData.result as string) || ''} onChange={(e) => updateField('result', e.target.value)} placeholder="e.g. AIR 347 or Selected" />
              </div>
              <div>
                <Label>Initials</Label>
                <Input value={(formData.initials as string) || ''} onChange={(e) => updateField('initials', e.target.value)} placeholder="Auto-generated from name" maxLength={2} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Gradient</Label>
                <Select value={(formData.gradient as string) || 'from-cyan-500 to-sky-500'} onValueChange={(v) => updateField('gradient', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {gradientOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input type="number" value={(formData.sortOrder as number) || 0} onChange={(e) => updateField('sortOrder', parseInt(e.target.value) || 0)} />
              </div>
            </div>
          </div>
        );

      case 'testimonial':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input value={(formData.name as string) || ''} onChange={(e) => updateField('name', e.target.value)} placeholder="Student name" />
              </div>
              <div>
                <Label>Course *</Label>
                <Input value={(formData.course as string) || ''} onChange={(e) => updateField('course', e.target.value)} placeholder="e.g. SSC CGL Coaching" />
              </div>
            </div>
            <div>
              <Label>Testimonial Text *</Label>
              <Textarea value={(formData.text as string) || ''} onChange={(e) => updateField('text', e.target.value)} placeholder="What the student said..." rows={4} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Badge</Label>
                <Input value={(formData.badge as string) || ''} onChange={(e) => updateField('badge', e.target.value)} placeholder="e.g. SSC CGL 2024" />
              </div>
              <div>
                <Label>Rating</Label>
                <Select value={String(formData.rating || 5)} onValueChange={(v) => updateField('rating', parseInt(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map((r) => (
                      <SelectItem key={r} value={String(r)}>{r} Star{r > 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Avatar Initials</Label>
                <Input value={(formData.avatar as string) || ''} onChange={(e) => updateField('avatar', e.target.value)} placeholder="Auto from name" maxLength={2} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Gradient</Label>
                <Select value={(formData.gradient as string) || 'from-cyan-500 to-teal-500'} onValueChange={(v) => updateField('gradient', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {gradientOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Badge Color Class</Label>
                <Input value={(formData.badgeColor as string) || ''} onChange={(e) => updateField('badgeColor', e.target.value)} placeholder="bg-cyan-500/20 text-cyan-300 border-cyan-500/30" />
              </div>
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input type="number" value={(formData.sortOrder as number) || 0} onChange={(e) => updateField('sortOrder', parseInt(e.target.value) || 0)} />
            </div>
          </div>
        );
    }
  };

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-cyan-600" />
            Homepage Content Manager
          </CardTitle>
          <CardDescription>
            Manage the Impact Stats, Achievement Cards, Success Stories, and Testimonials shown on the homepage.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="impact" className="gap-1.5">
            <TrendingUp className="h-4 w-4" /> Impact Stats
          </TabsTrigger>
          <TabsTrigger value="achievements" className="gap-1.5">
            <Award className="h-4 w-4" /> Achievements
          </TabsTrigger>
          <TabsTrigger value="stories" className="gap-1.5">
            <Trophy className="h-4 w-4" /> Success Stories
          </TabsTrigger>
          <TabsTrigger value="testimonials" className="gap-1.5">
            <Star className="h-4 w-4" /> Testimonials
          </TabsTrigger>
        </TabsList>

        <TabsContent value="impact">
          <EditableList
            title="Impact Stats"
            icon={TrendingUp}
            items={impactStats}
            onAdd={() => openDialog('impact')}
            onEdit={(item) => openDialog('impact', item)}
            onDelete={(id) => handleDelete('impact', id)}
            onToggleActive={(item) => handleToggleActive('impact', item)}
            renderCard={(item) => (
              <div>
                <p className="font-semibold">{(item as ImpactStat).label}</p>
                <p className="text-sm text-gray-500">{(item as ImpactStat).value}{(item as ImpactStat).suffix} · Icon: {(item as ImpactStat).iconName}</p>
              </div>
            )}
          />
        </TabsContent>

        <TabsContent value="achievements">
          <EditableList
            title="Achievement Cards"
            icon={Award}
            items={achievements}
            onAdd={() => openDialog('achievement')}
            onEdit={(item) => openDialog('achievement', item)}
            onDelete={(id) => handleDelete('achievement', id)}
            onToggleActive={(item) => handleToggleActive('achievement', item)}
            renderCard={(item) => (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">{(item as AchievementCard).badge}</Badge>
                  <span className="font-semibold">{(item as AchievementCard).title}</span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">{(item as AchievementCard).description}</p>
              </div>
            )}
          />
        </TabsContent>

        <TabsContent value="stories">
          <EditableList
            title="Success Stories"
            icon={Trophy}
            items={stories}
            onAdd={() => openDialog('story')}
            onEdit={(item) => openDialog('story', item)}
            onDelete={(id) => handleDelete('story', id)}
            onToggleActive={(item) => handleToggleActive('story', item)}
            renderCard={(item) => (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{(item as SuccessStory).name}</span>
                  <Badge variant="outline" className="text-xs">{(item as SuccessStory).result}</Badge>
                </div>
                <p className="text-sm text-gray-500">{(item as SuccessStory).exam} · &ldquo;{(item as SuccessStory).quote.slice(0, 60)}...&rdquo;</p>
              </div>
            )}
          />
        </TabsContent>

        <TabsContent value="testimonials">
          <EditableList
            title="Student Testimonials"
            icon={Star}
            items={testimonials}
            onAdd={() => openDialog('testimonial')}
            onEdit={(item) => openDialog('testimonial', item)}
            onDelete={(id) => handleDelete('testimonial', id)}
            onToggleActive={(item) => handleToggleActive('testimonial', item)}
            renderCard={(item) => (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{(item as Testimonial).name}</span>
                  <Badge variant="outline" className="text-xs">{(item as Testimonial).course}</Badge>
                  <span className="text-xs text-yellow-500">{'★'.repeat((item as Testimonial).rating)}</span>
                </div>
                <p className="text-sm text-gray-500">&ldquo;{(item as Testimonial).text.slice(0, 80)}...&rdquo;</p>
              </div>
            )}
          />
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit' : 'Add'}{' '}
              {dialogType === 'impact' ? 'Impact Stat' : dialogType === 'achievement' ? 'Achievement' : dialogType === 'story' ? 'Success Story' : 'Testimonial'}
            </DialogTitle>
          </DialogHeader>
          {renderDialogForm()}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>
              {editingItem ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
