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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Trophy,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Search,
  Eye,
  EyeOff,
  ArrowUpDown,
  BarChart3,
  GraduationCap,
  TrendingUp,
  Award,
  Clock,
  Users,
  BookOpen,
  Target,
  Laptop,
  Shield,
  CheckCircle2,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';

const ICON_OPTIONS = [
  'GraduationCap',
  'TrendingUp',
  'Award',
  'Clock',
  'Users',
  'BookOpen',
  'Target',
  'Laptop',
  'Shield',
  'CheckCircle2',
] as const;

type IconName = (typeof ICON_OPTIONS)[number];

const ICON_MAP: Record<IconName, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  GraduationCap,
  TrendingUp,
  Award,
  Clock,
  Users,
  BookOpen,
  Target,
  Laptop,
  Shield,
  CheckCircle2,
};

interface ImpactStat {
  id: string;
  label: string;
  value: number;
  suffix: string;
  iconName: string;
  iconBg: string;
  iconColor: string;
  numberColor: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AchievementCard {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  barColor: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function HomepageContentView() {
  // Impact Stats state
  const [impactStats, setImpactStats] = useState<ImpactStat[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsSearch, setStatsSearch] = useState('');
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [editingStat, setEditingStat] = useState<ImpactStat | null>(null);
  const [statsSaving, setStatsSaving] = useState(false);

  const [statLabel, setStatLabel] = useState('');
  const [statValue, setStatValue] = useState(0);
  const [statSuffix, setStatSuffix] = useState('');
  const [statIconName, setStatIconName] = useState<string>('GraduationCap');
  const [statIconBg, setStatIconBg] = useState('');
  const [statIconColor, setStatIconColor] = useState('');
  const [statNumberColor, setStatNumberColor] = useState('');
  const [statSortOrder, setStatSortOrder] = useState(0);
  const [statActive, setStatActive] = useState(true);

  // Achievement Cards state
  const [achievementCards, setAchievementCards] = useState<AchievementCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [cardsSearch, setCardsSearch] = useState('');
  const [cardsDialogOpen, setCardsDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<AchievementCard | null>(null);
  const [cardsSaving, setCardsSaving] = useState(false);

  const [cardBadge, setCardBadge] = useState('');
  const [cardBadgeColor, setCardBadgeColor] = useState('');
  const [cardTitle, setCardTitle] = useState('');
  const [cardDescription, setCardDescription] = useState('');
  const [cardBarColor, setCardBarColor] = useState('');
  const [cardSortOrder, setCardSortOrder] = useState(0);
  const [cardActive, setCardActive] = useState(true);

  // Fetch Impact Stats
  const fetchImpactStats = async () => {
    try {
      const res = await fetch('/api/impact-stats');
      const data = await res.json();
      if (res.ok) {
        setImpactStats(data.impactStats || []);
      }
    } catch {
      toast.error('Failed to fetch impact stats');
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch Achievement Cards
  const fetchAchievementCards = async () => {
    try {
      const res = await fetch('/api/achievement-cards');
      const data = await res.json();
      if (res.ok) {
        setAchievementCards(data.achievementCards || []);
      }
    } catch {
      toast.error('Failed to fetch achievement cards');
    } finally {
      setCardsLoading(false);
    }
  };

  useEffect(() => {
    fetchImpactStats();
    fetchAchievementCards();
  }, []);

  // Filtered lists
  const filteredStats = impactStats.filter(
    (s) =>
      !statsSearch ||
      s.label.toLowerCase().includes(statsSearch.toLowerCase()) ||
      s.suffix.toLowerCase().includes(statsSearch.toLowerCase())
  );

  const filteredCards = achievementCards.filter(
    (c) =>
      !cardsSearch ||
      c.title.toLowerCase().includes(cardsSearch.toLowerCase()) ||
      c.badge.toLowerCase().includes(cardsSearch.toLowerCase()) ||
      c.description.toLowerCase().includes(cardsSearch.toLowerCase())
  );

  // Impact Stats CRUD
  const openCreateStat = () => {
    setEditingStat(null);
    setStatLabel('');
    setStatValue(0);
    setStatSuffix('');
    setStatIconName('GraduationCap');
    setStatIconBg('');
    setStatIconColor('');
    setStatNumberColor('');
    setStatSortOrder(impactStats.length);
    setStatActive(true);
    setStatsDialogOpen(true);
  };

  const openEditStat = (stat: ImpactStat) => {
    setEditingStat(stat);
    setStatLabel(stat.label);
    setStatValue(stat.value);
    setStatSuffix(stat.suffix);
    setStatIconName(stat.iconName);
    setStatIconBg(stat.iconBg);
    setStatIconColor(stat.iconColor);
    setStatNumberColor(stat.numberColor);
    setStatSortOrder(stat.sortOrder);
    setStatActive(stat.active);
    setStatsDialogOpen(true);
  };

  const handleSaveStat = async () => {
    if (!statLabel.trim()) {
      toast.error('Label is required');
      return;
    }

    setStatsSaving(true);
    try {
      const payload = {
        label: statLabel.trim(),
        value: statValue,
        suffix: statSuffix,
        iconName: statIconName,
        iconBg: statIconBg,
        iconColor: statIconColor,
        numberColor: statNumberColor,
        sortOrder: statSortOrder,
        active: statActive,
      };

      if (editingStat) {
        const res = await fetch(`/api/impact-stats/${editingStat.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || 'Failed to update impact stat');
          return;
        }
        toast.success('Impact stat updated');
      } else {
        const res = await fetch('/api/impact-stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || 'Failed to create impact stat');
          return;
        }
        toast.success('Impact stat created');
      }

      setStatsDialogOpen(false);
      fetchImpactStats();
    } catch {
      toast.error('Failed to save impact stat');
    } finally {
      setStatsSaving(false);
    }
  };

  const handleDeleteStat = async (id: string) => {
    if (!confirm('Delete this impact stat?')) return;
    try {
      const res = await fetch(`/api/impact-stats/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Impact stat deleted');
        fetchImpactStats();
      } else {
        toast.error('Failed to delete impact stat');
      }
    } catch {
      toast.error('Failed to delete impact stat');
    }
  };

  const toggleStatActive = async (stat: ImpactStat) => {
    try {
      const res = await fetch(`/api/impact-stats/${stat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !stat.active }),
      });
      if (res.ok) {
        toast.success(stat.active ? 'Impact stat deactivated' : 'Impact stat activated');
        fetchImpactStats();
      }
    } catch {
      toast.error('Failed to update impact stat');
    }
  };

  // Achievement Cards CRUD
  const openCreateCard = () => {
    setEditingCard(null);
    setCardBadge('');
    setCardBadgeColor('');
    setCardTitle('');
    setCardDescription('');
    setCardBarColor('');
    setCardSortOrder(achievementCards.length);
    setCardActive(true);
    setCardsDialogOpen(true);
  };

  const openEditCard = (card: AchievementCard) => {
    setEditingCard(card);
    setCardBadge(card.badge);
    setCardBadgeColor(card.badgeColor);
    setCardTitle(card.title);
    setCardDescription(card.description);
    setCardBarColor(card.barColor);
    setCardSortOrder(card.sortOrder);
    setCardActive(card.active);
    setCardsDialogOpen(true);
  };

  const handleSaveCard = async () => {
    if (!cardTitle.trim()) {
      toast.error('Title is required');
      return;
    }

    setCardsSaving(true);
    try {
      const payload = {
        badge: cardBadge.trim(),
        badgeColor: cardBadgeColor,
        title: cardTitle.trim(),
        description: cardDescription.trim(),
        barColor: cardBarColor,
        sortOrder: cardSortOrder,
        active: cardActive,
      };

      if (editingCard) {
        const res = await fetch(`/api/achievement-cards/${editingCard.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || 'Failed to update achievement card');
          return;
        }
        toast.success('Achievement card updated');
      } else {
        const res = await fetch('/api/achievement-cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || 'Failed to create achievement card');
          return;
        }
        toast.success('Achievement card created');
      }

      setCardsDialogOpen(false);
      fetchAchievementCards();
    } catch {
      toast.error('Failed to save achievement card');
    } finally {
      setCardsSaving(false);
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm('Delete this achievement card?')) return;
    try {
      const res = await fetch(`/api/achievement-cards/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Achievement card deleted');
        fetchAchievementCards();
      } else {
        toast.error('Failed to delete achievement card');
      }
    } catch {
      toast.error('Failed to delete achievement card');
    }
  };

  const toggleCardActive = async (card: AchievementCard) => {
    try {
      const res = await fetch(`/api/achievement-cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !card.active }),
      });
      if (res.ok) {
        toast.success(card.active ? 'Achievement card deactivated' : 'Achievement card activated');
        fetchAchievementCards();
      }
    } catch {
      toast.error('Failed to update achievement card');
    }
  };

  // Summary counts
  const statsActiveCount = impactStats.filter((s) => s.active).length;
  const statsInactiveCount = impactStats.filter((s) => !s.active).length;
  const cardsActiveCount = achievementCards.filter((c) => c.active).length;
  const cardsInactiveCount = achievementCards.filter((c) => !c.active).length;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="impact-stats">
        <TabsList>
          <TabsTrigger value="impact-stats" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Impact Stats
          </TabsTrigger>
          <TabsTrigger value="achievement-cards" className="gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            Achievement Cards
          </TabsTrigger>
        </TabsList>

        {/* ========== Impact Stats Tab ========== */}
        <TabsContent value="impact-stats" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Total Stats', value: impactStats.length, color: 'text-gray-900 dark:text-gray-100' },
              { label: 'Active', value: statsActiveCount, color: 'text-green-700 dark:text-green-400' },
              { label: 'Inactive', value: statsInactiveCount, color: 'text-red-700 dark:text-red-400' },
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
                placeholder="Search impact stats..."
                value={statsSearch}
                onChange={(e) => setStatsSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={openCreateStat} className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white">
              <Plus className="h-4 w-4" />
              New Stat
            </Button>
          </div>

          {/* Loading */}
          {statsLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-cyan-600 animate-spin" />
            </div>
          )}

          {/* Empty State */}
          {!statsLoading && filteredStats.length === 0 && (
            <div className="text-center py-16">
              <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {statsSearch ? 'No matching stats' : 'No impact stats yet'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {statsSearch ? 'Try a different search term' : 'Create your first impact stat for the Our Impact section'}
              </p>
              {!statsSearch && (
                <Button onClick={openCreateStat} className="mt-4 gap-2 bg-cyan-600 hover:bg-cyan-700 text-white">
                  <Plus className="h-4 w-4" />
                  Create Stat
                </Button>
              )}
            </div>
          )}

          {/* Stats List */}
          {!statsLoading && filteredStats.length > 0 && (
            <div className="space-y-3">
              {filteredStats.map((stat) => {
                const IconComponent = ICON_MAP[stat.iconName as IconName] || BarChart3;
                return (
                  <Card
                    key={stat.id}
                    className={`border shadow-sm hover:shadow-md transition-shadow dark:bg-gray-900 ${
                      !stat.active ? 'opacity-60' : ''
                    }`}
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            {stat.iconBg && (
                              <span
                                className="inline-flex items-center justify-center h-7 w-7 rounded-lg"
                                style={{ backgroundColor: stat.iconBg }}
                              >
                                <IconComponent className="h-4 w-4" style={{ color: stat.iconColor || undefined }} />
                              </span>
                            )}
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{stat.label}</h3>
                            <Badge
                              variant="outline"
                              className={
                                stat.active
                                  ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400'
                                  : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400'
                              }
                            >
                              {stat.active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                              <ArrowUpDown className="h-2.5 w-2.5 mr-0.5" /> {stat.sortOrder}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Value: <span className={stat.numberColor || 'text-cyan-600 font-semibold'}>{stat.value.toLocaleString('en-IN')}{stat.suffix}</span>
                            {stat.iconName && <span className="ml-2">Icon: {stat.iconName}</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleStatActive(stat)}
                            title={stat.active ? 'Deactivate' : 'Activate'}
                          >
                            {stat.active ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditStat(stat)}
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4 text-gray-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => handleDeleteStat(stat.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Create/Edit Stat Dialog */}
          <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingStat ? 'Edit Impact Stat' : 'Create Impact Stat'}</DialogTitle>
                <DialogDescription>
                  {editingStat ? 'Update the impact stat details.' : 'Add a new stat to the Our Impact section.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label htmlFor="stat-label">Label *</Label>
                  <Input
                    id="stat-label"
                    placeholder="e.g. Students Trained"
                    value={statLabel}
                    onChange={(e) => setStatLabel(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stat-value">Value *</Label>
                    <Input
                      id="stat-value"
                      type="number"
                      min={0}
                      value={statValue}
                      onChange={(e) => setStatValue(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stat-suffix">Suffix</Label>
                    <Input
                      id="stat-suffix"
                      placeholder="e.g. +, %+"
                      value={statSuffix}
                      onChange={(e) => setStatSuffix(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stat-icon">Icon</Label>
                  <Select value={statIconName} onValueChange={setStatIconName}>
                    <SelectTrigger id="stat-icon" className="w-full">
                      <SelectValue placeholder="Select icon" />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((icon) => (
                        <SelectItem key={icon} value={icon}>
                          {icon}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stat-icon-bg">Icon Background</Label>
                    <Input
                      id="stat-icon-bg"
                      placeholder="e.g. bg-cyan-100"
                      value={statIconBg}
                      onChange={(e) => setStatIconBg(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stat-icon-color">Icon Color</Label>
                    <Input
                      id="stat-icon-color"
                      placeholder="e.g. text-cyan-600"
                      value={statIconColor}
                      onChange={(e) => setStatIconColor(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stat-number-color">Number Color</Label>
                  <Input
                    id="stat-number-color"
                    placeholder="e.g. text-cyan-400"
                    value={statNumberColor}
                    onChange={(e) => setStatNumberColor(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stat-sort">Sort Order</Label>
                    <Input
                      id="stat-sort"
                      type="number"
                      min={0}
                      value={statSortOrder}
                      onChange={(e) => setStatSortOrder(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={statActive}
                        onCheckedChange={setStatActive}
                        id="stat-active"
                      />
                      <Label htmlFor="stat-active" className="text-sm cursor-pointer">
                        Active
                      </Label>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setStatsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveStat}
                    disabled={statsSaving || !statLabel.trim()}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    {statsSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : editingStat ? (
                      'Update Stat'
                    ) : (
                      'Create Stat'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ========== Achievement Cards Tab ========== */}
        <TabsContent value="achievement-cards" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Total Cards', value: achievementCards.length, color: 'text-gray-900 dark:text-gray-100' },
              { label: 'Active', value: cardsActiveCount, color: 'text-green-700 dark:text-green-400' },
              { label: 'Inactive', value: cardsInactiveCount, color: 'text-red-700 dark:text-red-400' },
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
                placeholder="Search achievement cards..."
                value={cardsSearch}
                onChange={(e) => setCardsSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={openCreateCard} className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white">
              <Plus className="h-4 w-4" />
              New Card
            </Button>
          </div>

          {/* Loading */}
          {cardsLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-cyan-600 animate-spin" />
            </div>
          )}

          {/* Empty State */}
          {!cardsLoading && filteredCards.length === 0 && (
            <div className="text-center py-16">
              <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {cardsSearch ? 'No matching cards' : 'No achievement cards yet'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {cardsSearch ? 'Try a different search term' : 'Create your first achievement card for the Our Impact section'}
              </p>
              {!cardsSearch && (
                <Button onClick={openCreateCard} className="mt-4 gap-2 bg-cyan-600 hover:bg-cyan-700 text-white">
                  <Plus className="h-4 w-4" />
                  Create Card
                </Button>
              )}
            </div>
          )}

          {/* Cards List */}
          {!cardsLoading && filteredCards.length > 0 && (
            <div className="space-y-3">
              {filteredCards.map((card) => (
                <Card
                  key={card.id}
                  className={`border shadow-sm hover:shadow-md transition-shadow dark:bg-gray-900 ${
                    !card.active ? 'opacity-60' : ''
                  }`}
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {card.badge && (
                            <span
                              className="inline-block text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ backgroundColor: card.badgeColor ? undefined : '#dcfce7', color: card.badgeColor || '#166534' }}
                            >
                              {card.badgeColor ? (
                                <span className={card.badgeColor}>{card.badge}</span>
                              ) : (
                                card.badge
                              )}
                            </span>
                          )}
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{card.title}</h3>
                          <Badge
                            variant="outline"
                            className={
                              card.active
                                ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400'
                                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400'
                            }
                          >
                            {card.active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                            <ArrowUpDown className="h-2.5 w-2.5 mr-0.5" /> {card.sortOrder}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{card.description}</p>
                        {card.barColor && (
                          <div className="mt-2 h-1.5 w-20 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            <div className={`h-full rounded-full ${card.barColor}`} style={{ width: '70%' }} />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleCardActive(card)}
                          title={card.active ? 'Deactivate' : 'Activate'}
                        >
                          {card.active ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditCard(card)}
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4 text-gray-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteCard(card.id)}
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

          {/* Create/Edit Card Dialog */}
          <Dialog open={cardsDialogOpen} onOpenChange={setCardsDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingCard ? 'Edit Achievement Card' : 'Create Achievement Card'}</DialogTitle>
                <DialogDescription>
                  {editingCard ? 'Update the achievement card details.' : 'Add a new achievement card to the Our Impact section.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="card-badge">Badge</Label>
                    <Input
                      id="card-badge"
                      placeholder="e.g. SSC CGL 2024"
                      value={cardBadge}
                      onChange={(e) => setCardBadge(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card-badge-color">Badge Color</Label>
                    <Input
                      id="card-badge-color"
                      placeholder="e.g. text-green-700"
                      value={cardBadgeColor}
                      onChange={(e) => setCardBadgeColor(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card-title">Title *</Label>
                  <Input
                    id="card-title"
                    placeholder="e.g. SSC CGL 2024 Results"
                    value={cardTitle}
                    onChange={(e) => setCardTitle(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card-description">Description</Label>
                  <Textarea
                    id="card-description"
                    placeholder="Describe the achievement..."
                    value={cardDescription}
                    onChange={(e) => setCardDescription(e.target.value)}
                    className="min-h-[100px] resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card-bar-color">Bar Color</Label>
                  <Input
                    id="card-bar-color"
                    placeholder="e.g. bg-cyan-500"
                    value={cardBarColor}
                    onChange={(e) => setCardBarColor(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="card-sort">Sort Order</Label>
                    <Input
                      id="card-sort"
                      type="number"
                      min={0}
                      value={cardSortOrder}
                      onChange={(e) => setCardSortOrder(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={cardActive}
                        onCheckedChange={setCardActive}
                        id="card-active"
                      />
                      <Label htmlFor="card-active" className="text-sm cursor-pointer">
                        Active
                      </Label>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setCardsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveCard}
                    disabled={cardsSaving || !cardTitle.trim()}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    {cardsSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : editingCard ? (
                      'Update Card'
                    ) : (
                      'Create Card'
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
