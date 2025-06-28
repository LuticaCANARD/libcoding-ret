<script lang="ts">
  import { onMount } from 'svelte';
  import { getUserMatches, updateMatchStatus } from '../lib/api';
  import { getCurrentUser } from '../lib/auth';
  import { setError, setLoading, setView } from '../lib/store';
  import { error, isLoading } from '../lib/store';
  import type { Match } from '../lib/api';
  import type { User } from '../lib/auth';

  let matches: Match[] = [];
  let currentUser: User | null = null;

  onMount(async () => {
    currentUser = getCurrentUser();
    if (currentUser) {
      await loadMatches();
    }
  });

  async function loadMatches() {
    setLoading(true);
    setError(null);

    try {
      matches = await getUserMatches();
    } catch (err) {
      setError(err instanceof Error ? err.message : '매칭 목록을 가져오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleMatchAction(matchId: number, status: 'ACCEPTED' | 'REJECTED') {
    setLoading(true);
    setError(null);

    try {
      await updateMatchStatus(matchId, status);
      await loadMatches(); // Reload matches after update
    } catch (err) {
      setError(err instanceof Error ? err.message : '매칭 상태 업데이트에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function getStatusText(status: string): string {
    switch (status) {
      case 'PENDING': return '대기 중';
      case 'ACCEPTED': return '수락됨';
      case 'REJECTED': return '거절됨';
      case 'COMPLETED': return '완료됨';
      default: return status;
    }
  }

  function getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'ACCEPTED': return 'status-accepted';
      case 'REJECTED': return 'status-rejected';
      case 'COMPLETED': return 'status-completed';
      default: return '';
    }
  }

  // Separate matches by role and status
  $: sentRequests = matches.filter(match => 
    currentUser?.role === 'mentee' && currentUser.id === match.menteeId
  );
  
  $: receivedRequests = matches.filter(match => 
    currentUser?.role === 'mentor' && currentUser.id === match.mentorId
  );

  $: pendingReceivedRequests = receivedRequests.filter(match => match.status === 'PENDING');
</script>

<div class="matches-container">
  <div class="matches-header">
    <h2>매칭 현황</h2>
    <button on:click={() => setView('profile')} class="btn-secondary">프로필로 돌아가기</button>
  </div>

  {#if $error}
    <div class="error-message">{$error}</div>
  {/if}

  {#if $isLoading}
    <div class="loading">매칭 목록을 불러오는 중...</div>
  {:else if !currentUser}
    <div class="no-data">로그인이 필요합니다.</div>
  {:else}
    <div class="matches-content">
      <!-- For Mentees: Show sent requests -->
      {#if currentUser.role === 'mentee'}
        <div class="section">
          <h3>보낸 멘토링 요청</h3>
          {#if sentRequests.length === 0}
            <div class="no-matches">
              <p>아직 보낸 멘토링 요청이 없습니다.</p>
              <button on:click={() => setView('mentors')} class="btn-primary">멘토 찾기</button>
            </div>
          {:else}
            <div class="matches-list">
              {#each sentRequests as match}
                <div class="match-card">
                  <div class="match-header">
                    <div class="match-info">
                      <h4>{match.mentor?.name || '알 수 없는 멘토'}</h4>
                      <span class="status-badge {getStatusClass(match.status)}">
                        {getStatusText(match.status)}
                      </span>
                    </div>
                    <div class="match-date">
                      {new Date(match.createdAt).toLocaleDateString('ko-KR')}
                    </div>
                  </div>

                  {#if match.mentor?.expertise && match.mentor.expertise.length > 0}
                    <div class="expertise-tags">
                      {#each match.mentor.expertise as expertise}
                        <span class="expertise-tag">{expertise}</span>
                      {/each}
                    </div>
                  {/if}

                  {#if match.message}
                    <div class="match-message">
                      <strong>전달 메시지:</strong>
                      <p>{match.message}</p>
                    </div>
                  {/if}

                  {#if match.mentor?.bio}
                    <div class="mentor-bio">
                      <strong>멘토 소개:</strong>
                      <p>{match.mentor.bio}</p>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}

      <!-- For Mentors: Show received requests -->
      {#if currentUser.role === 'mentor'}
        <!-- Pending requests that need action -->
        {#if pendingReceivedRequests.length > 0}
          <div class="section">
            <h3>대기 중인 멘토링 요청</h3>
            <div class="matches-list">
              {#each pendingReceivedRequests as match}
                <div class="match-card pending">
                  <div class="match-header">
                    <div class="match-info">
                      <h4>{match.mentee?.name || '알 수 없는 멘티'}</h4>
                      <span class="status-badge {getStatusClass(match.status)}">
                        {getStatusText(match.status)}
                      </span>
                    </div>
                    <div class="match-date">
                      {new Date(match.createdAt).toLocaleDateString('ko-KR')}
                    </div>
                  </div>

                  {#if match.message}
                    <div class="match-message">
                      <strong>멘티의 메시지:</strong>
                      <p>{match.message}</p>
                    </div>
                  {/if}

                  {#if match.mentee?.bio}
                    <div class="mentee-bio">
                      <strong>멘티 소개:</strong>
                      <p>{match.mentee.bio}</p>
                    </div>
                  {/if}

                  <div class="match-actions">
                    <button 
                      on:click={() => handleMatchAction(match.id, 'ACCEPTED')}
                      disabled={$isLoading}
                      class="btn-success"
                    >
                      수락
                    </button>
                    <button 
                      on:click={() => handleMatchAction(match.id, 'REJECTED')}
                      disabled={$isLoading}
                      class="btn-danger"
                    >
                      거절
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- All received requests -->
        <div class="section">
          <h3>받은 멘토링 요청 전체</h3>
          {#if receivedRequests.length === 0}
            <div class="no-matches">
              <p>아직 받은 멘토링 요청이 없습니다.</p>
            </div>
          {:else}
            <div class="matches-list">
              {#each receivedRequests as match}
                <div class="match-card">
                  <div class="match-header">
                    <div class="match-info">
                      <h4>{match.mentee?.name || '알 수 없는 멘티'}</h4>
                      <span class="status-badge {getStatusClass(match.status)}">
                        {getStatusText(match.status)}
                      </span>
                    </div>
                    <div class="match-date">
                      {new Date(match.createdAt).toLocaleDateString('ko-KR')}
                    </div>
                  </div>

                  {#if match.message}
                    <div class="match-message">
                      <strong>멘티의 메시지:</strong>
                      <p>{match.message}</p>
                    </div>
                  {/if}

                  {#if match.mentee?.bio}
                    <div class="mentee-bio">
                      <strong>멘티 소개:</strong>
                      <p>{match.mentee.bio}</p>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .matches-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem;
  }

  .matches-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .matches-header h2 {
    margin: 0;
    color: #333;
  }

  .loading, .no-data {
    text-align: center;
    padding: 3rem;
    color: #666;
    font-size: 1.1rem;
  }

  .section {
    margin-bottom: 3rem;
  }

  .section h3 {
    margin: 0 0 1.5rem 0;
    color: #333;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #007bff;
  }

  .no-matches {
    text-align: center;
    padding: 2rem;
    background: #f8f9fa;
    border-radius: 8px;
    color: #666;
  }

  .matches-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .match-card {
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .match-card.pending {
    border-left: 4px solid #ffc107;
    background: #fffbf0;
  }

  .match-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .match-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .match-info h4 {
    margin: 0;
    color: #333;
    font-size: 1.1rem;
  }

  .match-date {
    color: #6c757d;
    font-size: 0.875rem;
  }

  .status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .status-pending {
    background: #fff3cd;
    color: #856404;
  }

  .status-accepted {
    background: #d4edda;
    color: #155724;
  }

  .status-rejected {
    background: #f8d7da;
    color: #721c24;
  }

  .status-completed {
    background: #d1ecf1;
    color: #0c5460;
  }

  .expertise-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .expertise-tag {
    background: #e9ecef;
    color: #495057;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
  }

  .match-message, .mentor-bio, .mentee-bio {
    margin-bottom: 1rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 4px;
  }

  .match-message strong, .mentor-bio strong, .mentee-bio strong {
    color: #495057;
    font-size: 0.875rem;
  }

  .match-message p, .mentor-bio p, .mentee-bio p {
    margin: 0.5rem 0 0 0;
    color: #6c757d;
    line-height: 1.4;
  }

  .match-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #eee;
  }

  /* Button styles */
  .btn-primary, .btn-secondary, .btn-success, .btn-danger {
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

  .btn-secondary {
    background: #6c757d;
    color: white;
  }

  .btn-secondary:hover {
    background: #545b62;
  }

  .btn-success {
    background: #28a745;
    color: white;
  }

  .btn-success:hover:not(:disabled) {
    background: #218838;
  }

  .btn-danger {
    background: #dc3545;
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background: #c82333;
  }

  button:disabled {
    background: #ccc !important;
    cursor: not-allowed;
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
    .matches-container {
      padding: 1rem;
    }

    .matches-header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .match-header {
      flex-direction: column;
      gap: 0.5rem;
    }

    .match-actions {
      flex-direction: column;
    }
  }
</style>
