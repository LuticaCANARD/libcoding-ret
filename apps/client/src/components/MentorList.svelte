<script lang="ts">
  import { onMount } from 'svelte';
  import { getMentors, createMatchRequest } from '../lib/api';
  import { setError, setLoading, setView } from '../lib/store';
  import { error, isLoading } from '../lib/store';
  import type { Mentor } from '../lib/api';

  let mentors: Mentor[] = [];
  let filteredMentors: Mentor[] = [];
  let searchQuery = '';
  let selectedExpertise = '';
  let selectedSkillLevel = '';
  let availableExpertise: string[] = [];

  // Filter options
  const skillLevels = [
    { value: '', label: '모든 수준' },
    { value: 'BEGINNER', label: '초급' },
    { value: 'INTERMEDIATE', label: '중급' },
    { value: 'ADVANCED', label: '고급' },
    { value: 'EXPERT', label: '전문가' }
  ];

  onMount(async () => {
    await loadMentors();
  });

  async function loadMentors() {
    setLoading(true);
    setError(null);

    try {
      mentors = await getMentors();
      
      // Extract unique expertise areas
      const expertiseSet = new Set<string>();
      mentors.forEach(mentor => {
        mentor.expertise?.forEach(exp => expertiseSet.add(exp));
      });
      availableExpertise = Array.from(expertiseSet).sort();
      
      applyFilters();
    } catch (err) {
      setError(err instanceof Error ? err.message : '멘토 목록을 가져오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    filteredMentors = mentors.filter(mentor => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = mentor.name.toLowerCase().includes(query);
        const matchesBio = mentor.bio?.toLowerCase().includes(query);
        const matchesExpertise = mentor.expertise?.some(exp => 
          exp.toLowerCase().includes(query)
        );
        
        if (!matchesName && !matchesBio && !matchesExpertise) {
          return false;
        }
      }

      // Expertise filter
      if (selectedExpertise && mentor.expertise) {
        if (!mentor.expertise.includes(selectedExpertise)) {
          return false;
        }
      }

      // Skill level filter
      if (selectedSkillLevel && mentor.skillLevel !== selectedSkillLevel) {
        return false;
      }

      return true;
    });
  }

  async function requestMentoring(mentorId: number) {
    setLoading(true);
    setError(null);

    try {
      await createMatchRequest(mentorId);
      setView('matches');
    } catch (err) {
      setError(err instanceof Error ? err.message : '멘토링 요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function getSkillLevelLabel(level: string): string {
    const skillLevel = skillLevels.find(sl => sl.value === level);
    return skillLevel ? skillLevel.label : level;
  }

  // Reactive statements for filters
  $: {
    searchQuery;
    selectedExpertise;
    selectedSkillLevel;
    applyFilters();
  }
</script>

<div class="mentors-container">
  <div class="mentors-header">
    <h2>멘토 찾기</h2>
    <button on:click={() => setView('profile')} class="btn-secondary">프로필로 돌아가기</button>
  </div>

  {#if $error}
    <div class="error-message">{$error}</div>
  {/if}

  <!-- Filters -->
  <div class="filters">
    <div class="search-bar">
      <input
        type="text"
        placeholder="멘토 이름, 전문 분야, 소개글 검색..."
        bind:value={searchQuery}
      />
    </div>

    <div class="filter-row">
      <div class="filter-group">
        <label for="expertise">전문 분야</label>
        <select id="expertise" bind:value={selectedExpertise}>
          <option value="">모든 분야</option>
          {#each availableExpertise as expertise}
            <option value={expertise}>{expertise}</option>
          {/each}
        </select>
      </div>

      <div class="filter-group">
        <label for="skillLevel">실력 수준</label>
        <select id="skillLevel" bind:value={selectedSkillLevel}>
          {#each skillLevels as level}
            <option value={level.value}>{level.label}</option>
          {/each}
        </select>
      </div>
    </div>
  </div>

  <!-- Mentors List -->
  {#if $isLoading}
    <div class="loading">멘토 목록을 불러오는 중...</div>
  {:else if filteredMentors.length === 0}
    <div class="no-mentors">
      {mentors.length === 0 ? '등록된 멘토가 없습니다.' : '검색 조건에 맞는 멘토가 없습니다.'}
    </div>
  {:else}
    <div class="mentors-grid">
      {#each filteredMentors as mentor}
        <div class="mentor-card">
          <div class="mentor-header">
            <h3>{mentor.name}</h3>
            {#if mentor.skillLevel}
              <span class="skill-badge">{getSkillLevelLabel(mentor.skillLevel)}</span>
            {/if}
          </div>

          {#if mentor.bio}
            <p class="mentor-bio">{mentor.bio}</p>
          {/if}

          {#if mentor.expertise && mentor.expertise.length > 0}
            <div class="expertise-section">
              <h4>전문 분야</h4>
              <div class="expertise-tags">
                {#each mentor.expertise as expertise}
                  <span class="expertise-tag">{expertise}</span>
                {/each}
              </div>
            </div>
          {/if}

          <div class="mentor-footer">
            <span class="join-date">
              가입일: {new Date(mentor.createdAt).toLocaleDateString('ko-KR')}
            </span>
            <button 
              on:click={() => requestMentoring(mentor.id)} 
              disabled={$isLoading}
              class="btn-primary"
            >
              멘토링 요청
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .mentors-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .mentors-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .mentors-header h2 {
    margin: 0;
    color: #333;
  }

  .filters {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;
  }

  .search-bar {
    margin-bottom: 1rem;
  }

  .search-bar input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    box-sizing: border-box;
  }

  .filter-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .filter-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #555;
  }

  .filter-group select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.875rem;
    box-sizing: border-box;
  }

  .loading, .no-mentors {
    text-align: center;
    padding: 3rem;
    color: #666;
    font-size: 1.1rem;
  }

  .mentors-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }

  .mentor-card {
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: box-shadow 0.2s;
  }

  .mentor-card:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .mentor-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .mentor-header h3 {
    margin: 0;
    color: #333;
    font-size: 1.25rem;
  }

  .skill-badge {
    background: #007bff;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .mentor-bio {
    color: #666;
    line-height: 1.5;
    margin-bottom: 1rem;
  }

  .expertise-section {
    margin-bottom: 1rem;
  }

  .expertise-section h4 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .expertise-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .expertise-tag {
    background: #e9ecef;
    color: #495057;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
  }

  .mentor-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #eee;
  }

  .join-date {
    color: #6c757d;
    font-size: 0.875rem;
  }

  /* Button styles */
  .btn-primary, .btn-secondary {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
  }

  .btn-primary {
    background: #007bff;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #0056b3;
  }

  .btn-primary:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: #6c757d;
    color: white;
  }

  .btn-secondary:hover {
    background: #545b62;
  }

  .error-message {
    background: #f8d7da;
    color: #721c24;
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    border: 1px solid #f5c6cb;
  }

  @media (max-width: 768px) {
    .mentors-container {
      padding: 1rem;
    }

    .mentors-header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .filter-row {
      grid-template-columns: 1fr;
    }

    .mentors-grid {
      grid-template-columns: 1fr;
    }

    .mentor-footer {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }
  }
</style>
