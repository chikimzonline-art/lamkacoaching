'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Star,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Search,
  Eye,
  EyeOff,
  ArrowUpDown,
  MessageSquare,
  Quote,
} from 'lucide-react';
import { toast } from 'sonner';

interface SuccessStory {
  id: string;
  name: string;
  exam: string;
  quote: string;
  result: string;
  initials: string;
  color: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Testimonial {
  id: string;
  name: string;
  course: string;
  badge: string;
  badgeColor: string;
  text: string;
  rating: number;
  initials: string;
  color: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function StoriesView() {
  // Success Stories state
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [storiesSearch, setStoriesSearch] = useState('');
  const [storiesDialogOpen, setStoriesDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<SuccessStory | null>(null);
  const [storiesSaving, setStoriesSaving] = useState(false);

  const [storyName, setStoryName] = useState('');
  const [storyExam, setStoryExam] = useState('');
  const [storyQuote, setStoryQuote] = useState('');
  const [storyResult, setStoryResult] = useState('');
  const [storyInitials, setStoryInitials] = useState('');
  const [storyColor, setStoryColor] = useState('');
  const [storySortOrder, setStorySortOrder] = useState(0);
  const [storyActive, setStoryActive] = useState(true);

  // Testimonials state
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const [testimonialsSearch, setTestimonialsSearch] = useState('');
  const [testimonialsDialogOpen, setTestimonialsDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [testimonialsSaving, setTestimonialsSaving] = useState(false);

  const [testName, setTestName] = useState('');
  const [testCourse, setTestCourse] = useState('');
  const [testBadge, setTestBadge] = useState('');
  const [testBadgeColor, setTestBadgeColor] = useState('');
  const [testText, setTestText] = useState('');
  const [testRating, setTestRating] = useState(5);
  const [testInitials, setTestInitials] = useState('');
  const [testColor, setTestColor] = useState('');
  const [testSortOrder, setTestSortOrder] = useState(0);
  const [testActive, setTestActive] = useState(true);

  // Fetch Success Stories
  const fetchStories = async () => {
    try {
      const res = await fetch('/api/success-stories');
      const data = await res.json();
      if (res.ok) {
        setStories(data.successStories || []);
      }
    } catch {
      toast.error('Failed to fetch success stories');
    } finally {
      setStoriesLoading(false);
    }
  };

  // Fetch Testimonials
  const fetchTestimonials = async () => {
    try {
      const res = await fetch('/api/testimonials');
      const data = await res.json();
      if (res.ok) {
        setTestimonials(data.testimonials || []);
      }
    } catch {
      toast.error('Failed to fetch testimonials');
    } finally {
      setTestimonialsLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
    fetchTestimonials();
  }, []);

  // Filtered lists
  const filteredStories = stories.filter(
    (s) =>
      !storiesSearch ||
      s.name.toLowerCase().includes(storiesSearch.toLowerCase()) ||
      s.exam.toLowerCase().includes(storiesSearch.toLowerCase()) ||
      s.quote.toLowerCase().includes(storiesSearch.toLowerCase())
  );

  const filteredTestimonials = testimonials.filter(
    (t) =>
      !testimonialsSearch ||
      t.name.toLowerCase().includes(testimonialsSearch.toLowerCase()) ||
      t.course.toLowerCase().includes(testimonialsSearch.toLowerCase()) ||
      t.text.toLowerCase().includes(testimonialsSearch.toLowerCase())
  );

  // Success Stories CRUD
  const openCreateStory = () => {
    setEditingStory(null);
    setStoryName('');
    setStoryExam('');
    setStoryQuote('');
    setStoryResult('');
    setStoryInitials('');
    setStoryColor('');
    setStorySortOrder(stories.length);
    setStoryActive(true);
    setStoriesDialogOpen(true);
  };

  const openEditStory = (story: SuccessStory) => {
    setEditingStory(story);
    setStoryName(story.name);
    setStoryExam(story.exam);
    setStoryQuote(story.quote);
    setStoryResult(story.result);
    setStoryInitials(story.initials);
    setStoryColor(story.color);
    setStorySortOrder(story.sortOrder);
    setStoryActive(story.active);
    setStoriesDialogOpen(true);
  };

  const handleSaveStory = async () => {
    if (!storyName.trim()) {
      toast.error('Name is required');
      return;
    }

    setStoriesSaving(true);
    try {
      const payload = {
        name: storyName.trim(),
        exam: storyExam.trim(),
        quote: storyQuote.trim(),
        result: storyResult.trim(),
        initials: storyInitials.trim(),
        color: storyColor,
        sortOrder: storySortOrder,
        active: storyActive,
      };

      if (editingStory) {
        const res = await fetch(`/api/success-stories/${editingStory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || 'Failed to update success story');
          return;
        }
        toast.success('Success story updated');
      } else {
        const res = await fetch('/api/success-stories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || 'Failed to create success story');
          return;
        }
        toast.success('Success story created');
      }

      setStoriesDialogOpen(false);
      fetchStories();
    } catch {
      toast.error('Failed to save success story');
    } finally {
      setStoriesSaving(false);
    }
  };

  const handleDeleteStory = async (id: string) => {
    if (!confirm('Delete this success story?')) return;
    try {
      const res = await fetch(`/api/success-stories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Success story deleted');
        fetchStories();
      } else {
        toast.error('Failed to delete success story');
      }
    } catch {
      toast.error('Failed to delete success story');
    }
  };

  const toggleStoryActive = async (story: SuccessStory) => {
    try {
      const res = await fetch(`/api/success-stories/${story.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !story.active }),
      });
      if (res.ok) {
        toast.success(story.active ? 'Success story deactivated' : 'Success story activated');
        fetchStories();
      }
    } catch {
      toast.error('Failed to update success story');
    }
  };

  // Testimonials CRUD
  const openCreateTestimonial = () => {
    setEditingTestimonial(null);
    setTestName('');
    setTestCourse('');
    setTestBadge('');
    setTestBadgeColor('');
    setTestText('');
    setTestRating(5);
    setTestInitials('');
    setTestColor('');
    setTestSortOrder(testimonials.length);
    setTestActive(true);
    setTestimonialsDialogOpen(true);
  };

  const openEditTestimonial = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setTestName(testimonial.name);
    setTestCourse(testimonial.course);
    setTestBadge(testimonial.badge);
    setTestBadgeColor(testimonial.badgeColor);
    setTestText(testimonial.text);
    setTestRating(testimonial.rating);
    setTestInitials(testimonial.initials);
    setTestColor(testimonial.color);
    setTestSortOrder(testimonial.sortOrder);
    setTestActive(testimonial.active);
    setTestimonialsDialogOpen(true);
  };

  const handleSaveTestimonial = async () => {
    if (!testName.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!testText.trim()) {
      toast.error('Testimonial text is required');
      return;
    }

    setTestimonialsSaving(true);
    try {
      const payload = {
        name: testName.trim(),
        course: testCourse.trim(),
        badge: testBadge.trim(),
        badgeColor: testBadgeColor,
        text: testText.trim(),
        rating: testRating,
        initials: testInitials.trim(),
        color: testColor,
        sortOrder: testSortOrder,
        active: testActive,
      };

      if (editingTestimonial) {
        const res = await fetch(`/api/testimonials/${editingTestimonial.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || 'Failed to update testimonial');
          return;
        }
        toast.success('Testimonial updated');
      } else {
        const res = await fetch('/api/testimonials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || 'Failed to create testimonial');
          return;
        }
        toast.success('Testimonial created');
      }

      setTestimonialsDialogOpen(false);
      fetchTestimonials();
    } catch {
      toast.error('Failed to save testimonial');
    } finally {
      setTestimonialsSaving(false);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm('Delete this testimonial?')) return;
    try {
      const res = await fetch(`/api/testimonials/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Testimonial deleted');
        fetchTestimonials();
      } else {
        toast.error('Failed to delete testimonial');
      }
    } catch {
      toast.error('Failed to delete testimonial');
    }
  };

  const toggleTestimonialActive = async (testimonial: Testimonial) => {
    try {
      const res = await fetch(`/api/testimonials/${testimonial.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !testimonial.active }),
      });
      if (res.ok) {
        toast.success(testimonial.active ? 'Testimonial deactivated' : 'Testimonial activated');
        fetchTestimonials();
      }
    } catch {
      toast.error('Failed to update testimonial');
    }
  };

  // Summary counts
  const storiesActiveCount = stories.filter((s) => s.active).length;
  const storiesInactiveCount = stories.filter((s) => !s.active).length;
  const testimonialsActiveCount = testimonials.filter((t) => t.active).length;
  const testimonialsInactiveCount = testimonials.filter((t) => !t.active).length;

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3.5 w-3.5 ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="success-stories">
        <TabsList>
          <TabsTrigger value="success-stories" className="gap-1.5">
            <Quote className="h-3.5 w-3.5" />
            Success Stories
          </TabsTrigger>
          <TabsTrigger value="testimonials" className="gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            Testimonials
          </TabsTrigger>
        </TabsList>

        {/* ========== Success Stories Tab ========== */}
        <TabsContent value="success-stories" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Total Stories', value: stories.length, color: 'text-gray-900 dark:text-gray-100' },
              { label: 'Active', value: storiesActiveCount, color: 'text-green-700 dark:text-green-400' },
              { label: 'Inactive', value: storiesInactiveCount, color: 'text-red-700 dark:text-red-400' },
            ].map((stat) => (
              <Card key={stat.label} className="border-0 shadow-sm dark:bg-gray-900">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search success stories..."
                value={storiesSearch}
                onChange={(e) => setStoriesSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={openCreateStory} className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white">
              <Plus className="h-4 w-4" />
              New Story
            </Button>
          </div>

          {/* Loading */}
          {storiesLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-cyan-600 animate-spin" />
            </div>
          )}

          {/* Empty State */}
          {!storiesLoading && filteredStories.length === 0 && (
            <div className="text-center py-16">
              <Quote className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {storiesSearch ? 'No matching stories' : 'No success stories yet'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {storiesSearch ? 'Try a different search term' : 'Create your first success story to showcase student achievements'}
              </p>
              {!storiesSearch && (
                <Button onClick={openCreateStory} className="mt-4 gap-2 bg-cyan-600 hover:bg-cyan-700 text-white">
                  <Plus className="h-4 w-4" />
                  Create Story
                </Button>
              )}
            </div>
          )}

          {/* Stories List */}
          {!storiesLoading && filteredStories.length > 0 && (
            <div className="space-y-3">
              {filteredStories.map((story) => (
                <Card
                  key={story.id}
                  className={`border shadow-sm hover:shadow-md transition-shadow dark:bg-gray-900 ${
                    !story.active ? 'opacity-60' : ''
                  }`}
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {story.initials && (
                          <div
                            className={`inline-flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br shrink-0 text-white font-bold text-sm ${
                              story.color || 'from-cyan-500 to-sky-500'
                            }`}
                          >
                            {story.initials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{story.name}</h3>
                            {story.exam && (
                              <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-400">
                                {story.exam}
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={
                                story.active
                                  ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400'
                                  : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400'
                              }
                            >
                              {story.active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                              <ArrowUpDown className="h-2.5 w-2.5 mr-0.5" /> {story.sortOrder}
                            </Badge>
                          </div>
                          {story.quote && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 italic">&ldquo;{story.quote}&rdquo;</p>
                          )}
                          {story.result && (
                            <p className="text-sm text-cyan-600 dark:text-cyan-400 mt-0.5">Result: {story.result}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleStoryActive(story)}
                          title={story.active ? 'Deactivate' : 'Activate'}
                        >
                          {story.active ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditStory(story)}
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4 text-gray-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteStory(story.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Create/Edit Story Dialog */}
          <Dialog open={storiesDialogOpen} onOpenChange={setStoriesDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingStory ? 'Edit Success Story' : 'Create Success Story'}</DialogTitle>
                <DialogDescription>
                  {editingStory ? 'Update the success story details.' : 'Add a new student success story.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="story-name">Name *</Label>
                    <Input
                      id="story-name"
                      placeholder="e.g. Priya Sharma"
                      value={storyName}
                      onChange={(e) => setStoryName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="story-exam">Exam</Label>
                    <Input
                      id="story-exam"
                      placeholder="e.g. SSC CGL 2024"
                      value={storyExam}
                      onChange={(e) => setStoryExam(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="story-quote">Quote</Label>
                  <Textarea
                    id="story-quote"
                    placeholder="Student quote about their experience..."
                    value={storyQuote}
                    onChange={(e) => setStoryQuote(e.target.value)}
                    className="min-h-[100px] resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="story-result">Result</Label>
                  <Input
                    id="story-result"
                    placeholder="e.g. Selected as Tax Assistant"
                    value={storyResult}
                    onChange={(e) => setStoryResult(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="story-initials">Initials</Label>
                    <Input
                      id="story-initials"
                      placeholder="e.g. PS"
                      value={storyInitials}
                      onChange={(e) => setStoryInitials(e.target.value)}
                      maxLength={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="story-color">Color</Label>
                    <Input
                      id="story-color"
                      placeholder="e.g. from-cyan-500 to-sky-500"
                      value={storyColor}
                      onChange={(e) => setStoryColor(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="story-sort">Sort Order</Label>
                    <Input
                      id="story-sort"
                      type="number"
                      min={0}
                      value={storySortOrder}
                      onChange={(e) => setStorySortOrder(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={storyActive}
                        onCheckedChange={setStoryActive}
                        id="story-active"
                      />
                      <Label htmlFor="story-active" className="text-sm cursor-pointer">
                        Active
                      </Label>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setStoriesDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveStory}
                    disabled={storiesSaving || !storyName.trim()}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    {storiesSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : editingStory ? (
                      'Update Story'
                    ) : (
                      'Create Story'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ========== Testimonials Tab ========== */}
        <TabsContent value="testimonials" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Total Testimonials', value: testimonials.length, color: 'text-gray-900 dark:text-gray-100' },
              { label: 'Active', value: testimonialsActiveCount, color: 'text-green-700 dark:text-green-400' },
              { label: 'Inactive', value: testimonialsInactiveCount, color: 'text-red-700 dark:text-red-400' },
            ].map((stat) => (
              <Card key={stat.label} className="border-0 shadow-sm dark:bg-gray-900">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search testimonials..."
                value={testimonialsSearch}
                onChange={(e) => setTestimonialsSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={openCreateTestimonial} className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white">
              <Plus className="h-4 w-4" />
              New Testimonial
            </Button>
          </div>

          {/* Loading */}
          {testimonialsLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-cyan-600 animate-spin" />
            </div>
          )}

          {/* Empty State */}
          {!testimonialsLoading && filteredTestimonials.length === 0 && (
            <div className="text-center py-16">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {testimonialsSearch ? 'No matching testimonials' : 'No testimonials yet'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {testimonialsSearch ? 'Try a different search term' : 'Create your first testimonial to display on the website'}
              </p>
              {!testimonialsSearch && (
                <Button onClick={openCreateTestimonial} className="mt-4 gap-2 bg-cyan-600 hover:bg-cyan-700 text-white">
                  <Plus className="h-4 w-4" />
                  Create Testimonial
                </Button>
              )}
            </div>
          )}

          {/* Testimonials List */}
          {!testimonialsLoading && filteredTestimonials.length > 0 && (
            <div className="space-y-3">
              {filteredTestimonials.map((testimonial) => (
                <Card
                  key={testimonial.id}
                  className={`border shadow-sm hover:shadow-md transition-shadow dark:bg-gray-900 ${
                    !testimonial.active ? 'opacity-60' : ''
                  }`}
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {testimonial.initials && (
                          <div
                            className={`inline-flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br shrink-0 text-white font-bold text-sm ${
                              testimonial.color || 'from-cyan-500 to-sky-500'
                            }`}
                          >
                            {testimonial.initials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{testimonial.name}</h3>
                            {testimonial.course && (
                              <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                                {testimonial.course}
                              </Badge>
                            )}
                            {testimonial.badge && (
                              <span
                                className="inline-block text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ backgroundColor: testimonial.badgeColor ? undefined : '#dcfce7', color: testimonial.badgeColor || '#166534' }}
                              >
                                {testimonial.badgeColor ? (
                                  <span className={testimonial.badgeColor}>{testimonial.badge}</span>
                                ) : (
                                  testimonial.badge
                                )}
                              </span>
                            )}
                            <Badge
                              variant="outline"
                              className={
                                testimonial.active
                                  ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400'
                                  : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400'
                              }
                            >
                              {testimonial.active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                              <ArrowUpDown className="h-2.5 w-2.5 mr-0.5" /> {testimonial.sortOrder}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">&ldquo;{testimonial.text}&rdquo;</p>
                          <div className="mt-1">
                            {renderStars(testimonial.rating)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleTestimonialActive(testimonial)}
                          title={testimonial.active ? 'Deactivate' : 'Activate'}
                        >
                          {testimonial.active ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditTestimonial(testimonial)}
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4 text-gray-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteTestimonial(testimonial.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Create/Edit Testimonial Dialog */}
          <Dialog open={testimonialsDialogOpen} onOpenChange={setTestimonialsDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingTestimonial ? 'Edit Testimonial' : 'Create Testimonial'}</DialogTitle>
                <DialogDescription>
                  {editingTestimonial ? 'Update the testimonial details.' : 'Add a new student testimonial.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="test-name">Name *</Label>
                    <Input
                      id="test-name"
                      placeholder="e.g. Rahul Verma"
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="test-course">Course</Label>
                    <Input
                      id="test-course"
                      placeholder="e.g. CCC Computer Course"
                      value={testCourse}
                      onChange={(e) => setTestCourse(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="test-badge">Badge</Label>
                    <Input
                      id="test-badge"
                      placeholder="e.g. Topper"
                      value={testBadge}
                      onChange={(e) => setTestBadge(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="test-badge-color">Badge Color</Label>
                    <Input
                      id="test-badge-color"
                      placeholder="e.g. text-green-700"
                      value={testBadgeColor}
                      onChange={(e) => setTestBadgeColor(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test-text">Testimonial Text *</Label>
                  <Textarea
                    id="test-text"
                    placeholder="What the student said about their experience..."
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    className="min-h-[100px] resize-none"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="test-rating">Rating</Label>
                    <Input
                      id="test-rating"
                      type="number"
                      min={1}
                      max={5}
                      value={testRating}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (val >= 1 && val <= 5) setTestRating(val);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="test-initials">Initials</Label>
                    <Input
                      id="test-initials"
                      placeholder="e.g. RV"
                      value={testInitials}
                      onChange={(e) => setTestInitials(e.target.value)}
                      maxLength={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="test-color">Color</Label>
                    <Input
                      id="test-color"
                      placeholder="e.g. from-purple-500 to-pink-500"
                      value={testColor}
                      onChange={(e) => setTestColor(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="test-sort">Sort Order</Label>
                    <Input
                      id="test-sort"
                      type="number"
                      min={0}
                      value={testSortOrder}
                      onChange={(e) => setTestSortOrder(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={testActive}
                        onCheckedChange={setTestActive}
                        id="test-active"
                      />
                      <Label htmlFor="test-active" className="text-sm cursor-pointer">
                        Active
                      </Label>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setTestimonialsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveTestimonial}
                    disabled={testimonialsSaving || !testName.trim() || !testText.trim()}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    {testimonialsSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : editingTestimonial ? (
                      'Update Testimonial'
                    ) : (
                      'Create Testimonial'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
