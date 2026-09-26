'use client';

import * as React from 'react';
import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import {
  Search,
  ExternalLink,
  Copy,
  Check,
  FolderKanban,
  FileText,
  Code,
  PenTool,
  Server,
  Users,
  Video,
  Monitor,
  BookOpen,
  Link as LinkIcon,
  Layers,
  Trash2,
  X,
  LayoutGrid,
  List as ListIcon,
} from 'lucide-react';
import { ResourceCategory } from '@prisma/client';
import { archiveResourceAction } from './actions';
import { WorkspaceAddResourceDialog } from './workspace-add-resource-dialog';

export interface ResourceItem {
  id: string;
  title: string;
  url: string;
  description: string | null;
  category: ResourceCategory;
  tags: string[];
  projectId: string;
  project: {
    id: string;
    name: string;
    projectCode: string;
  };
  addedBy: {
    id: string;
    name: string;
  };
  relatedTask?: {
    id: string;
    taskCode: string;
    title: string;
  } | null;
  createdAt: string; // ISO date
}

interface ProjectOption {
  id: string;
  name: string;
  projectCode: string;
}

interface WorkspaceResourceHubProps {
  resources: ResourceItem[];
  projects: ProjectOption[];
  currentUserId: string;
  isAdmin: boolean;
}

const CATEGORY_META: Record<
  ResourceCategory,
  { label: string; icon: React.ElementType; badgeBg: string; badgeFg: string; border: string }
> = {
  DOCUMENTATION: {
    label: 'Documentation',
    icon: FileText,
    badgeBg: 'bg-[#F0FDF4]',
    badgeFg: 'text-[#15803D]',
    border: 'border-[#BBF7D0]',
  },
  DEVELOPMENT: {
    label: 'Development',
    icon: Code,
    badgeBg: 'bg-[#F5F3FF]',
    badgeFg: 'text-[#7C3AED]',
    border: 'border-[#DDD6FE]',
  },
  API: {
    label: 'API Reference',
    icon: Server,
    badgeBg: 'bg-[#FFFBEB]',
    badgeFg: 'text-[#B45309]',
    border: 'border-[#FDE68A]',
  },
  RESEARCH: {
    label: 'Research',
    icon: BookOpen,
    badgeBg: 'bg-[#EFF6FF]',
    badgeFg: 'text-[#2563EB]',
    border: 'border-[#BFDBFE]',
  },
  DESIGN: {
    label: 'Design',
    icon: PenTool,
    badgeBg: 'bg-[#FDF2F8]',
    badgeFg: 'text-[#DB2777]',
    border: 'border-[#FBCFE8]',
  },
  CLIENT_REFERENCE: {
    label: 'Client Reference',
    icon: Users,
    badgeBg: 'bg-[#F1F5F9]',
    badgeFg: 'text-[#475467]',
    border: 'border-[#E2E8F0]',
  },
  COMPETITOR: {
    label: 'Competitor',
    icon: Monitor,
    badgeBg: 'bg-[#FEF2F2]',
    badgeFg: 'text-[#DC2626]',
    border: 'border-[#FECACA]',
  },
  MEETING: {
    label: 'Meeting',
    icon: Video,
    badgeBg: 'bg-[#F0FDF4]',
    badgeFg: 'text-[#16A34A]',
    border: 'border-[#BBF7D0]',
  },
  TUTORIAL: {
    label: 'Tutorial',
    icon: BookOpen,
    badgeBg: 'bg-[#EFF6FF]',
    badgeFg: 'text-[#0284C7]',
    border: 'border-[#BAE6FD]',
  },
  OTHER: {
    label: 'Other',
    icon: LinkIcon,
    badgeBg: 'bg-[#F2F4F7]',
    badgeFg: 'text-[#667085]',
    border: 'border-[#E4E7EC]',
  },
};

const CATEGORY_ORDER: ResourceCategory[] = [
  'DOCUMENTATION',
  'DEVELOPMENT',
  'API',
  'RESEARCH',
  'DESIGN',
  'CLIENT_REFERENCE',
  'COMPETITOR',
  'MEETING',
  'TUTORIAL',
  'OTHER',
];

export function WorkspaceResourceHub({
  resources,
  projects,
  currentUserId,
  isAdmin,
}: WorkspaceResourceHubProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'LIST' | 'GRID'>('LIST');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'TITLE_AZ' | 'CATEGORY'>('NEWEST');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Attention metric counters
  const metrics = useMemo(() => {
    const total = resources.length;
    const docs = resources.filter(
      (r) => r.category === 'DOCUMENTATION' || r.category === 'TUTORIAL'
    ).length;
    const devApi = resources.filter(
      (r) => r.category === 'DEVELOPMENT' || r.category === 'API'
    ).length;
    const designResearch = resources.filter(
      (r) => r.category === 'DESIGN' || r.category === 'RESEARCH'
    ).length;

    return { total, docs, devApi, designResearch };
  }, [resources]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: resources.length };
    CATEGORY_ORDER.forEach((c) => {
      counts[c] = resources.filter((r) => r.category === c).length;
    });
    return counts;
  }, [resources]);

  // Copy to clipboard
  const handleCopyUrl = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // Archive resource
  const handleArchive = (id: string, projectId: string, title: string) => {
    if (!confirm(`Are you sure you want to archive "${title}"?`)) return;
    startTransition(async () => {
      await archiveResourceAction(id, projectId);
    });
  };

  // Filtered & Sorted list
  const filteredResources = useMemo(() => {
    let list = resources.filter((r) => {
      // Category filter
      if (selectedCategory !== 'ALL' && r.category !== selectedCategory) {
        return false;
      }

      // Project filter
      if (selectedProjectId !== 'ALL' && r.projectId !== selectedProjectId) {
        return false;
      }

      // Search term
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesDesc = Boolean(r.description?.toLowerCase().includes(q));
        const matchesTags = r.tags.some((t) => t.toLowerCase().includes(q));
        const matchesProject =
          r.project.name.toLowerCase().includes(q) ||
          r.project.projectCode.toLowerCase().includes(q);
        const matchesAddedBy = r.addedBy.name.toLowerCase().includes(q);
        let matchesHost = false;
        try {
          matchesHost = new URL(r.url).hostname.toLowerCase().includes(q);
        } catch {}

        if (!matchesTitle && !matchesDesc && !matchesTags && !matchesProject && !matchesAddedBy && !matchesHost) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'NEWEST':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'OLDEST':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'TITLE_AZ':
          return a.title.localeCompare(b.title);
        case 'CATEGORY':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    return list;
  }, [resources, search, selectedCategory, selectedProjectId, sortBy]);

  const hasActiveFilters =
    search.trim() !== '' ||
    selectedCategory !== 'ALL' ||
    selectedProjectId !== 'ALL' ||
    sortBy !== 'NEWEST';

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('ALL');
    setSelectedProjectId('ALL');
    setSortBy('NEWEST');
  };

  const getHostname = (urlStr: string) => {
    try {
      return new URL(urlStr).hostname.replace(/^www\./, '');
    } catch {
      return 'link';
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E4E7EC] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] sm:text-[24px] font-semibold tracking-tight text-[#101828] flex items-center gap-2">
              <BookOpen className="size-5 text-[#5B5FEF]" />
              Knowledge Hub & Resources
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
              {resources.length} {resources.length === 1 ? 'Asset' : 'Assets'}
            </span>
          </div>
          <p className="mt-1 text-[13px] text-[#475467]">
            Centralized operational library for architectural guides, API specs, research reports, and technical documentation.
          </p>
        </div>

        {/* Add Resource Dialog */}
        {projects.length > 0 && (
          <div className="flex items-center gap-3">
            <WorkspaceAddResourceDialog projects={projects} />
          </div>
        )}
      </div>

      {/* 2. Attention Metrics Strip (§9: 4 stat cards, zero resting shadow) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Assets */}
        <button
          type="button"
          onClick={() => setSelectedCategory('ALL')}
          className={`p-3.5 sm:p-4 rounded-[8px] border text-left transition-all ${
            selectedCategory === 'ALL' && !hasActiveFilters
              ? 'ring-1 ring-[#5B5FEF] border-[#D0D5DD] bg-white'
              : 'bg-white border-[#E4E7EC] hover:bg-[#F9FAFC]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#475467] flex items-center gap-1.5">
              <Layers className="size-3.5 text-[#5B5FEF]" />
              Total Knowledge Assets
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[22px] sm:text-[24px] font-bold tracking-tight text-[#101828]">
              {metrics.total}
            </span>
            <span className="text-[11px] text-[#667085]">cataloged</span>
          </div>
        </button>

        {/* Documentation & Specs */}
        <button
          type="button"
          onClick={() => setSelectedCategory('DOCUMENTATION')}
          className={`p-3.5 sm:p-4 rounded-[8px] border text-left transition-all ${
            selectedCategory === 'DOCUMENTATION'
              ? 'ring-2 ring-[#15803D] border-[#15803D] bg-[#F0FDF4]/50'
              : 'bg-white border-[#E4E7EC] hover:bg-[#F9FAFC]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#475467] flex items-center gap-1.5">
              <FileText className="size-3.5 text-[#15803D]" />
              Docs & Tutorials
            </span>
            <span className="w-2 h-2 rounded-full bg-[#15803D]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[22px] sm:text-[24px] font-bold tracking-tight text-[#15803D]">
              {metrics.docs}
            </span>
            <span className="text-[11px] text-[#667085]">guides & specs</span>
          </div>
        </button>

        {/* Development & APIs */}
        <button
          type="button"
          onClick={() => setSelectedCategory('API')}
          className={`p-3.5 sm:p-4 rounded-[8px] border text-left transition-all ${
            selectedCategory === 'API' || selectedCategory === 'DEVELOPMENT'
              ? 'ring-2 ring-[#7C3AED] border-[#7C3AED] bg-[#F5F3FF]'
              : 'bg-white border-[#E4E7EC] hover:bg-[#F9FAFC]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#475467] flex items-center gap-1.5">
              <Server className="size-3.5 text-[#7C3AED]" />
              Dev & API References
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[22px] sm:text-[24px] font-bold tracking-tight text-[#101828]">
              {metrics.devApi}
            </span>
            <span className="text-[11px] text-[#667085]">endpoints & repos</span>
          </div>
        </button>

        {/* Design & Research */}
        <button
          type="button"
          onClick={() => setSelectedCategory('DESIGN')}
          className={`p-3.5 sm:p-4 rounded-[8px] border text-left transition-all ${
            selectedCategory === 'DESIGN' || selectedCategory === 'RESEARCH'
              ? 'ring-2 ring-[#2563EB] border-[#2563EB] bg-[#EFF6FF]'
              : 'bg-white border-[#E4E7EC] hover:bg-[#F9FAFC]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#475467] flex items-center gap-1.5">
              <PenTool className="size-3.5 text-[#2563EB]" />
              Design & Research
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[22px] sm:text-[24px] font-bold tracking-tight text-[#101828]">
              {metrics.designResearch}
            </span>
            <span className="text-[11px] text-[#667085]">assets & insights</span>
          </div>
        </button>
      </div>

      {/* 3. Category Filter Tabs (§13 Specification) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#E4E7EC]">
        <button
          type="button"
          onClick={() => setSelectedCategory('ALL')}
          className={`h-8 px-3 rounded-[6px] text-[12px] font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            selectedCategory === 'ALL'
              ? 'bg-[#101828] text-white'
              : 'text-[#475467] hover:bg-[#F2F4F7]'
          }`}
        >
          <span>All Resources</span>
          <span className={`px-1.5 py-0.2 rounded text-[10px] ${selectedCategory === 'ALL' ? 'bg-white/20 text-white' : 'bg-[#E4E7EC] text-[#475467]'}`}>
            {categoryCounts.ALL}
          </span>
        </button>

        {CATEGORY_ORDER.map((catKey) => {
          const meta = CATEGORY_META[catKey];
          const count = categoryCounts[catKey] || 0;
          const isSelected = selectedCategory === catKey;

          return (
            <button
              key={catKey}
              type="button"
              onClick={() => setSelectedCategory(catKey)}
              className={`h-8 px-3 rounded-[6px] text-[12px] font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#5B5FEF] text-white'
                  : 'text-[#475467] hover:bg-[#F2F4F7]'
              }`}
            >
              <span>{meta.label}</span>
              {count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[#E4E7EC] text-[#475467]'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. Search & Controls Toolbar */}
      <div className="bg-white border border-[#E4E7EC] rounded-[8px] p-3 sm:p-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 size-4 text-[#98A2B3]" />
            <input
              type="text"
              placeholder="Search by title, domain, description, tags, project, or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-8 rounded-[6px] border border-[#D0D5DD] bg-white text-[13px] text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-1 focus:ring-[#5B5FEF] focus:border-[#5B5FEF]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-[#98A2B3] hover:text-[#475467]"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Filter Controls Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Project Filter */}
            {projects.length > 0 && (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="h-9 px-2.5 rounded-[6px] border border-[#D0D5DD] bg-white text-[12px] font-medium text-[#475467] focus:outline-none focus:ring-1 focus:ring-[#5B5FEF]"
                aria-label="Filter by project"
              >
                <option value="ALL">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.projectCode})
                  </option>
                ))}
              </select>
            )}

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'NEWEST' | 'OLDEST' | 'TITLE_AZ' | 'CATEGORY')}
              className="h-9 px-2.5 rounded-[6px] border border-[#D0D5DD] bg-white text-[12px] font-medium text-[#475467] focus:outline-none focus:ring-1 focus:ring-[#5B5FEF]"
              aria-label="Sort resources"
            >
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
              <option value="TITLE_AZ">Title (A-Z)</option>
              <option value="CATEGORY">Category</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-[6px] border border-[#D0D5DD] p-0.5 bg-white">
              <button
                type="button"
                onClick={() => setViewMode('LIST')}
                className={`p-1.5 rounded-[4px] transition-colors ${
                  viewMode === 'LIST' ? 'bg-[#101828] text-white' : 'text-[#667085] hover:bg-[#F2F4F7]'
                }`}
                title="List View"
              >
                <ListIcon className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('GRID')}
                className={`p-1.5 rounded-[4px] transition-colors ${
                  viewMode === 'GRID' ? 'bg-[#101828] text-white' : 'text-[#667085] hover:bg-[#F2F4F7]'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="size-4" />
              </button>
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="h-9 px-2.5 text-[12px] font-semibold text-[#DC2626] hover:bg-red-50 rounded-[6px] transition-colors flex items-center gap-1"
              >
                <X className="size-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Resources Display (List / Grid) */}
      {filteredResources.length === 0 ? (
        <div className="bg-white border border-[#E4E7EC] rounded-[8px] py-16 px-6 text-center">
          <div className="w-12 h-12 rounded-full bg-[#F2F4F7] text-[#5B5FEF] mx-auto flex items-center justify-center mb-3">
            <BookOpen className="size-6 text-[#667085]" />
          </div>
          <h3 className="text-[15px] font-semibold text-[#101828]">No resources found</h3>
          <p className="text-[13px] text-[#667085] mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'No knowledge assets match your search query or filters. Try adjusting your search criteria.'
              : 'There are no documentation or reference links currently recorded in the knowledge hub.'}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#5B5FEF] text-white rounded-[6px] text-[12px] font-semibold hover:bg-[#4C50D8]"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : viewMode === 'LIST' ? (
        /* Compact List View (§13: Prefer a compact list over cards whenever a list scans faster) */
        <div className="bg-white border border-[#E4E7EC] rounded-[8px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="border-b border-[#E4E7EC] bg-[#F9FAFB] text-[11px] uppercase tracking-wider font-semibold text-[#475467]">
                <tr>
                  <th scope="col" className="px-4 py-3 min-w-[280px]">
                    Resource & Description
                  </th>
                  <th scope="col" className="px-4 py-3 min-w-[140px]">
                    Category
                  </th>
                  <th scope="col" className="px-4 py-3 min-w-[150px]">
                    Project Workspace
                  </th>
                  <th scope="col" className="px-4 py-3 min-w-[140px]">
                    Added By / Date
                  </th>
                  <th scope="col" className="px-4 py-3 text-right min-w-[110px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1F5]">
                {filteredResources.map((res) => {
                  const meta = CATEGORY_META[res.category] || CATEGORY_META.OTHER;
                  const Icon = meta.icon;
                  const hostname = getHostname(res.url);
                  const canArchive = isAdmin || res.addedBy.id === currentUserId;

                  return (
                    <tr key={res.id} className="hover:bg-[#F9FAFC] transition-colors group">
                      {/* Title, URL & Description */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <a
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-[13px] text-[#101828] hover:text-[#5B5FEF] hover:underline flex items-center gap-1.5"
                            >
                              {res.title}
                              <ExternalLink className="size-3 text-[#98A2B3]" />
                            </a>
                            <span className="text-[10px] font-mono text-[#667085] bg-[#F2F4F7] px-1.5 py-0.2 rounded border border-[#E4E7EC]">
                              {hostname}
                            </span>
                          </div>

                          {res.description && (
                            <p className="text-[12px] text-[#475467] line-clamp-1">
                              {res.description}
                            </p>
                          )}

                          {res.tags.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 pt-0.5">
                              {res.tags.map((t) => (
                                <span
                                  key={t}
                                  className="text-[10px] text-[#667085] bg-[#F9FAFC] px-1.5 py-0.2 rounded border border-[#EEF1F5]"
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border ${meta.badgeBg} ${meta.badgeFg} ${meta.border}`}
                        >
                          <Icon className="size-3" />
                          {meta.label}
                        </span>
                      </td>

                      {/* Project Workspace */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <Link
                            href={`/projects/${res.projectId}`}
                            className="inline-flex items-center gap-1 text-[12px] font-medium text-[#5B5FEF] hover:underline"
                          >
                            <FolderKanban className="size-3" />
                            {res.project.name}
                          </Link>
                          {res.relatedTask && (
                            <div className="text-[10px] text-[#667085]">
                              Task: {res.relatedTask.taskCode}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Added By & Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-[12px] font-medium text-[#101828]">
                          {res.addedBy.name}
                        </div>
                        <div className="text-[10px] text-[#667085]">
                          {formatDate(res.createdAt)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Copy URL */}
                          <button
                            type="button"
                            onClick={() => handleCopyUrl(res.id, res.url)}
                            className="inline-flex items-center justify-center size-7 rounded-[4px] border border-[#D0D5DD] bg-white text-[#475467] hover:text-[#101828] hover:bg-[#F9FAFC] transition-colors"
                            title={copiedId === res.id ? 'Copied URL!' : 'Copy link'}
                          >
                            {copiedId === res.id ? (
                              <Check className="size-3.5 text-[#16A34A]" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                          </button>

                          {/* Open External Link */}
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center size-7 rounded-[4px] border border-[#D0D5DD] bg-white text-[#475467] hover:text-[#5B5FEF] hover:bg-[#EFF6FF] hover:border-[#BFDBFE] transition-colors"
                            title="Open external link"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>

                          {/* Archive Action */}
                          {canArchive && (
                            <button
                              type="button"
                              onClick={() => handleArchive(res.id, res.projectId, res.title)}
                              className="inline-flex items-center justify-center size-7 rounded-[4px] border border-[#D0D5DD] bg-white text-[#475467] hover:text-[#DC2626] hover:bg-[#FEF2F2] hover:border-[#FECACA] transition-colors"
                              title="Archive resource"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredResources.map((res) => {
            const meta = CATEGORY_META[res.category] || CATEGORY_META.OTHER;
            const Icon = meta.icon;
            const hostname = getHostname(res.url);
            const canArchive = isAdmin || res.addedBy.id === currentUserId;

            return (
              <div
                key={res.id}
                className="bg-white border border-[#E4E7EC] rounded-[8px] p-4 flex flex-col justify-between hover:border-[#D0D5DD] transition-all"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${meta.badgeBg} ${meta.badgeFg} ${meta.border}`}
                    >
                      <Icon className="size-3" />
                      {meta.label}
                    </span>
                    <span className="text-[10px] font-mono text-[#667085] bg-[#F2F4F7] px-1.5 py-0.5 rounded">
                      {hostname}
                    </span>
                  </div>

                  <div>
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[14px] text-[#101828] hover:text-[#5B5FEF] hover:underline line-clamp-1"
                      title={res.title}
                    >
                      {res.title}
                    </a>
                    {res.description && (
                      <p className="mt-1 text-[12px] text-[#475467] line-clamp-2">
                        {res.description}
                      </p>
                    )}
                  </div>

                  {res.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      {res.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] text-[#667085] bg-[#F9FAFC] px-1.5 py-0.2 rounded border border-[#EEF1F5]"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#EEF1F5] flex items-center justify-between">
                  <div className="min-w-0">
                    <Link
                      href={`/projects/${res.projectId}`}
                      className="text-[11px] font-semibold text-[#5B5FEF] hover:underline truncate block"
                    >
                      {res.project.name}
                    </Link>
                    <div className="text-[10px] text-[#667085]">
                      {res.addedBy.name} • {formatDate(res.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(res.id, res.url)}
                      className="p-1.5 rounded border border-[#D0D5DD] bg-white text-[#475467] hover:text-[#101828] hover:bg-[#F9FAFC]"
                      title={copiedId === res.id ? 'Copied!' : 'Copy link'}
                    >
                      {copiedId === res.id ? (
                        <Check className="size-3.5 text-[#16A34A]" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded border border-[#D0D5DD] bg-white text-[#475467] hover:text-[#5B5FEF] hover:bg-[#EFF6FF]"
                      title="Open external link"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                    {canArchive && (
                      <button
                        type="button"
                        onClick={() => handleArchive(res.id, res.projectId, res.title)}
                        className="p-1.5 rounded border border-[#D0D5DD] bg-white text-[#475467] hover:text-[#DC2626] hover:bg-[#FEF2F2]"
                        title="Archive resource"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
