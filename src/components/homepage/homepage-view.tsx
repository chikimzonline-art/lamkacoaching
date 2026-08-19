'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Trophy, User } from 'lucide-react';
import { toast } from 'sonner';

/* ─── Types ─── */
interface SuccessStory {
  id?: string;
  name: string;
  achievement: string;
  batch: string;
  sortOrder: number;
  active: boolean;
}

export default function HomepageView() {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SuccessStory | null>(null);
  const [formData, setFormData] = useState<Partial<SuccessStory>>({
    name: '',
    achievement: '',
    batch: '',
    sortOrder: 0,
    active: true,
  });

  // Fetch stories
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

  useEffect(() => {
    fetchStories();
  }, []);

  const openDialog = (item?: SuccessStory) => {
    if (item) {
      setEditingItem(item);
      setFormData({ ...item });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        achievement: '',
        batch: '',
        sortOrder: stories.length,
        active: true,
      });
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
        body: JSON.stringify(
          isEditing
            ? { id: editingItem!.id, ...formData }
            : formData
        ),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

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
    } catch (error) {
      toast.error('Failed to delete');
    }
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
    } catch (error) {
      toast.error('Failed to update');
    }
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
    <div className="space-y-6">
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
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                          {item.name}
                        </h4>
                        <Badge variant="outline" className="text-xs border-cyan-300 text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/30">
                          {item.batch}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-cyan-600 dark:text-cyan-400 truncate mt-0.5">
                        {item.achievement}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={item.active}
                      onCheckedChange={() => handleToggleActive(item)}
                      title={item.active ? 'Active' : 'Inactive'}
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => item.id && handleDelete(item.id)}
                    >
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Success Story' : 'Add Success Story'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Student Name *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Rahul Sharma"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="achievement">Achievement *</Label>
              <Input
                id="achievement"
                value={formData.achievement || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, achievement: e.target.value }))}
                placeholder="e.g. SSC CGL 2023 - Income Tax Inspector"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="batch">Batch / Year *</Label>
              <Input
                id="batch"
                value={formData.batch || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, batch: e.target.value }))}
                placeholder="e.g. Batch of 2023"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder ?? 0}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sortOrder: parseInt(e.target.value, 10) || 0 }))
                  }
                />
              </div>

              <div className="space-y-1.5 flex flex-col justify-end">
                <div className="flex items-center gap-2 pb-2">
                  <Switch
                    id="active"
                    checked={formData.active ?? true}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, active: checked }))}
                  />
                  <Label htmlFor="active" className="cursor-pointer font-medium">Visible on site</Label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-700 text-white">
              {editingItem ? 'Save Changes' : 'Create Story'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
