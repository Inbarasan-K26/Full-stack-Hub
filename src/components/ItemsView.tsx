import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Circle,
  MoreVertical,
  Edit2,
  Trash2,
  Tag,
  RotateCcw,
  LayoutGrid,
  List as ListIcon,
  X,
  AlertTriangle,
  Loader2,
  Filter,
  ArrowUpDown,
  SlidersHorizontal,
} from 'lucide-react';
import { Item, ItemCategory, ItemPriority, ItemStatus, User } from '../types/index.js';
import { api } from '../services/api.js';

interface ItemsViewProps {
  items: Item[];
  currentUser: User | null;
  onRefreshItems: () => void;
  onOpenAuth: () => void;
  onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export function ItemsView({
  items,
  currentUser,
  onRefreshItems,
  onOpenAuth,
  onNotify,
}: ItemsViewProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'updated_desc' | 'created_desc' | 'title_asc' | 'title_desc' | 'priority_desc'>('updated_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: '/' focuses the search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement !== searchInputRef.current &&
        !(document.activeElement instanceof HTMLInputElement) &&
        !(document.activeElement instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Status counts for real-time tab badges
  const statusCounts = useMemo(() => {
    return {
      all: items.length,
      todo: items.filter((i) => i.status === 'todo').length,
      in_progress: items.filter((i) => i.status === 'in_progress').length,
      completed: items.filter((i) => i.status === 'completed').length,
    };
  }, [items]);

  const hasActiveFilters =
    search.trim() !== '' ||
    selectedStatus !== 'all' ||
    selectedCategory !== 'all' ||
    selectedPriority !== 'all';

  const handleClearAllFilters = () => {
    setSearch('');
    setSelectedStatus('all');
    setSelectedCategory('all');
    setSelectedPriority('all');
    searchInputRef.current?.focus();
  };

  // Modal states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState<ItemCategory>('Backend');
  const [formPriority, setFormPriority] = useState<ItemPriority>('medium');
  const [formStatus, setFormStatus] = useState<ItemStatus>('todo');
  const [formTags, setFormTags] = useState('');
  const [formAssignedTo, setFormAssignedTo] = useState('');
  const [saving, setSaving] = useState(false);

  // Filtered and Sorted items
  const filteredItems = useMemo(() => {
    const priorityWeights: Record<ItemPriority, number> = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    let result = items.filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesTags = item.tags.some((t) => t.toLowerCase().includes(q));
        const matchesCategory = item.category.toLowerCase().includes(q);
        const matchesStatus = item.status.replace('_', ' ').toLowerCase().includes(q);
        const matchesAssignee = item.assignedTo?.toLowerCase().includes(q) ?? false;
        if (!matchesTitle && !matchesDesc && !matchesTags && !matchesCategory && !matchesStatus && !matchesAssignee) {
          return false;
        }
      }
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
      if (selectedPriority !== 'all' && item.priority !== selectedPriority) return false;
      return true;
    });

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'title_asc') return a.title.localeCompare(b.title);
      if (sortBy === 'title_desc') return b.title.localeCompare(a.title);
      if (sortBy === 'created_desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'priority_desc') return (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
      // default: updated_desc
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return result;
  }, [items, search, selectedCategory, selectedStatus, selectedPriority, sortBy]);

  const openCreateModal = () => {
    if (!currentUser) {
      onNotify('info', 'Sign In Required', 'Please sign in to create or edit items.');
      onOpenAuth();
      return;
    }
    setEditingItem(null);
    setFormTitle('');
    setFormDesc('');
    setFormCategory('Backend');
    setFormPriority('medium');
    setFormStatus('todo');
    setFormTags('');
    setFormAssignedTo(currentUser.email);
    setIsEditorOpen(true);
  };

  const openEditModal = (item: Item) => {
    if (!currentUser) {
      onNotify('info', 'Sign In Required', 'Please sign in to update items.');
      onOpenAuth();
      return;
    }
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDesc(item.description);
    setFormCategory(item.category);
    setFormPriority(item.priority);
    setFormStatus(item.status);
    setFormTags(item.tags.join(', '));
    setFormAssignedTo(item.assignedTo || '');
    setIsEditorOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    setSaving(true);
    const tagsArray = formTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    try {
      if (editingItem) {
        await api.updateItem(editingItem.id, {
          title: formTitle,
          description: formDesc,
          category: formCategory,
          priority: formPriority,
          status: formStatus,
          assignedTo: formAssignedTo,
          tags: tagsArray,
        });
        onNotify('success', 'Item Updated', `"${formTitle}" saved successfully.`);
      } else {
        await api.createItem({
          title: formTitle,
          description: formDesc,
          category: formCategory,
          priority: formPriority,
          status: formStatus,
          assignedTo: formAssignedTo,
          tags: tagsArray,
        });
        onNotify('success', 'Item Created', `"${formTitle}" added to system.`);
      }
      setIsEditorOpen(false);
      onRefreshItems();
    } catch (err: any) {
      onNotify('error', 'Operation Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatusChange = async (item: Item, newStatus: ItemStatus) => {
    if (!currentUser) {
      onNotify('info', 'Sign In Required', 'Please sign in to modify status.');
      onOpenAuth();
      return;
    }
    try {
      await api.updateItem(item.id, { status: newStatus });
      onRefreshItems();
      onNotify('success', 'Status Updated', `Moved to ${newStatus.replace('_', ' ')}.`);
    } catch (err: any) {
      onNotify('error', 'Failed', err.message);
    }
  };

  const handleDeleteItem = async () => {
    if (!deletingItem) return;
    try {
      await api.deleteItem(deletingItem.id);
      onNotify('success', 'Deleted', `"${deletingItem.title}" has been deleted.`);
      setIsDeleteModalOpen(false);
      setDeletingItem(null);
      onRefreshItems();
    } catch (err: any) {
      onNotify('error', 'Delete Failed', err.message);
    }
  };

  const handleResetData = async () => {
    if (!currentUser) {
      onNotify('info', 'Sign In Required', 'Please sign in to reset demo records.');
      onOpenAuth();
      return;
    }
    try {
      await api.resetDemoData();
      onNotify('success', 'Database Reset', 'Default roadmap and demo items restored.');
      onRefreshItems();
    } catch (err: any) {
      onNotify('error', 'Reset Failed', err.message);
    }
  };

  const categories: (ItemCategory | 'all')[] = [
    'all',
    'Backend',
    'Frontend',
    'DevOps',
    'Security',
    'Database',
    'Architecture',
  ];

  return (
    <div className="space-y-6">
      {/* Search & Filter Hub */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        {/* Row 1: Search Input & Primary Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input Box */}
          <div className="relative flex-1 group">
            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-400 absolute left-3.5 top-3 transition-colors pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items by name, tag, category, or description... (Press '/' to focus)"
              className="w-full bg-slate-950/90 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl pl-10 pr-24 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
            />
            {/* Right badges / clear button inside search bar */}
            <div className="absolute right-2.5 top-2 flex items-center gap-1.5">
              {search ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    searchInputRef.current?.focus();
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-900 border border-slate-800 rounded">
                  /
                </kbd>
              )}
            </div>
          </div>

          {/* Right Controls: View mode toggle, Reset seeds, Add Item */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Table View"
              >
                <ListIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetData}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Reset to default seed data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Seeds</span>
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
        </div>

        {/* Row 2: Status Quick Filter Tabs + Sort & Priority */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          {/* Quick Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1 shrink-0">
              <Filter className="w-3 h-3 text-slate-400" />
              Status:
            </span>

            {/* All */}
            <button
              type="button"
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedStatus === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-semibold'
                  : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>All</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedStatus === 'all' ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {statusCounts.all}
              </span>
            </button>

            {/* To Do */}
            <button
              type="button"
              onClick={() => setSelectedStatus('todo')}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedStatus === 'todo'
                  ? 'bg-slate-700 text-white shadow-sm font-semibold'
                  : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Circle className="w-3 h-3 text-slate-400" />
              <span>To Do</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedStatus === 'todo' ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {statusCounts.todo}
              </span>
            </button>

            {/* In Progress */}
            <button
              type="button"
              onClick={() => setSelectedStatus('in_progress')}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedStatus === 'in_progress'
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30 font-semibold'
                  : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Clock className="w-3 h-3 text-amber-300" />
              <span>In Progress</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedStatus === 'in_progress' ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {statusCounts.in_progress}
              </span>
            </button>

            {/* Completed */}
            <button
              type="button"
              onClick={() => setSelectedStatus('completed')}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedStatus === 'completed'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-semibold'
                  : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-300" />
              <span>Completed</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedStatus === 'completed' ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {statusCounts.completed}
              </span>
            </button>
          </div>

          {/* Secondary Filters: Priority & Sort By */}
          <div className="flex items-center gap-2 text-xs shrink-0">
            {/* Priority Selector */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
              <span className="text-slate-500 text-[11px]">Priority:</span>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">All Priorities</option>
                <option value="urgent" className="bg-slate-900 text-rose-400">Urgent</option>
                <option value="high" className="bg-slate-900 text-amber-400">High</option>
                <option value="medium" className="bg-slate-900 text-blue-400">Medium</option>
                <option value="low" className="bg-slate-900 text-slate-400">Low</option>
              </select>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
              <span className="text-slate-500 text-[11px]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
              >
                <option value="updated_desc" className="bg-slate-900 text-white">Recently Updated</option>
                <option value="created_desc" className="bg-slate-900 text-white">Newest Created</option>
                <option value="title_asc" className="bg-slate-900 text-white">Name (A → Z)</option>
                <option value="title_desc" className="bg-slate-900 text-white">Name (Z → A)</option>
                <option value="priority_desc" className="bg-slate-900 text-white">Priority (Highest)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Row 3: Category Filter Chips Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs pt-1 border-t border-slate-800/40">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mr-1 shrink-0">
            Category:
          </span>
          {categories.map((cat) => {
            const count = cat === 'all' ? items.length : items.filter((i) => i.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg font-medium shrink-0 transition-all text-xs flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <span>{cat === 'all' ? 'All Categories' : cat}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Row 4: Results & Active Filters Feedback Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-medium">
              Showing <strong className="text-white">{filteredItems.length}</strong> of{' '}
              <strong className="text-slate-300">{items.length}</strong> items
            </span>

            {/* Active filter badges with dismiss X */}
            {search.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px]">
                <span>Search: "{search}"</span>
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="hover:text-white p-0.5 cursor-pointer"
                  title="Remove search filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px]">
                <span>Status: {selectedStatus.replace('_', ' ')}</span>
                <button
                  type="button"
                  onClick={() => setSelectedStatus('all')}
                  className="hover:text-white p-0.5 cursor-pointer"
                  title="Remove status filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px]">
                <span>Category: {selectedCategory}</span>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="hover:text-white p-0.5 cursor-pointer"
                  title="Remove category filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedPriority !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px]">
                <span>Priority: {selectedPriority}</span>
                <button
                  type="button"
                  onClick={() => setSelectedPriority('all')}
                  className="hover:text-white p-0.5 cursor-pointer"
                  title="Remove priority filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear All Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Items Rendering */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-white text-base">No items match your search or filter</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            {hasActiveFilters
              ? 'Try modifying your search term or clearing active status and category filters.'
              : 'Try creating a brand new item to get started.'}
          </p>
          <div className="flex items-center justify-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear All Filters
              </button>
            )}
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Item
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between transition-all group shadow-sm hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-lg ${
                        item.priority === 'urgent'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : item.priority === 'high'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : item.priority === 'medium'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.priority}
                    </span>
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                      title="Edit Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingItem(item);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition-colors"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-white text-sm leading-snug group-hover:text-indigo-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">{item.description}</p>

                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded-md border border-slate-800"
                      >
                        <Tag className="w-2.5 h-2.5 text-slate-500" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                {/* Status toggle selector */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => handleQuickStatusChange(item, 'todo')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-colors ${
                      item.status === 'todo'
                        ? 'bg-slate-700 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Todo
                  </button>
                  <button
                    onClick={() => handleQuickStatusChange(item, 'in_progress')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-colors ${
                      item.status === 'in_progress'
                        ? 'bg-amber-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => handleQuickStatusChange(item, 'completed')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-colors ${
                      item.status === 'completed'
                        ? 'bg-emerald-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Done
                  </button>
                </div>

                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(item.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5 pl-5">Status</th>
                  <th className="p-3.5">Title & Description</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Assignee</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 pl-5 whitespace-nowrap">
                      <button
                        onClick={() =>
                          handleQuickStatusChange(
                            item,
                            item.status === 'completed'
                              ? 'todo'
                              : item.status === 'todo'
                              ? 'in_progress'
                              : 'completed'
                          )
                        }
                        className={`flex items-center gap-1.5 font-medium px-2 py-1 rounded-lg text-[11px] ${
                          item.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : item.status === 'in_progress'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                        title="Click to cycle status"
                      >
                        {item.status === 'completed' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : item.status === 'in_progress' ? (
                          <Clock className="w-3.5 h-3.5" />
                        ) : (
                          <Circle className="w-3.5 h-3.5" />
                        )}
                        <span>{item.status.replace('_', ' ')}</span>
                      </button>
                    </td>
                    <td className="p-3.5 max-w-md">
                      <div className="font-semibold text-white">{item.title}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{item.description}</div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                          item.priority === 'urgent'
                            ? 'bg-rose-500/20 text-rose-300'
                            : item.priority === 'high'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                      {item.assignedTo || 'Unassigned'}
                    </td>
                    <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingItem(item);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Editor Modal (Create / Edit) */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
              <h3 className="font-bold text-white text-base">
                {editingItem ? 'Edit Resource Item' : 'Create New Resource Item'}
              </h3>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Implement OAuth Flow"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Provide technical details, context, and criteria..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ItemCategory)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-2 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Backend">Backend</option>
                    <option value="Frontend">Frontend</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Security">Security</option>
                    <option value="Database">Database</option>
                    <option value="Architecture">Architecture</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as ItemPriority)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-2 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ItemStatus)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-2 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="api, express, jwt"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Assigned Email</label>
                  <input
                    type="email"
                    value={formAssignedTo}
                    onChange={(e) => setFormAssignedTo(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/30"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base">Delete Item?</h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              Are you sure you want to permanently delete <strong className="text-white">"{deletingItem.title}"</strong>?
              This action cannot be undone.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteItem}
                className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-rose-600/30"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
