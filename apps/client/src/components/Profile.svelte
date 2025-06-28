<script lang="ts">
  import { onMount } from 'svelte';
  import { getCurrentUser, logout } from '../lib/auth';
  import { updateUserProfile } from '../lib/api';
  import { user, error, isLoading } from '../lib/store';
  import { setError, setLoading, setView } from '../lib/store';
  import type { User } from '../lib/auth';

  let currentUser: User | null = null;
  let isEditing = false;
  let editForm = {
    name: '',
    bio: '',
    expertise: [] as string[],
    skillLevel: ''
  };
  let newExpertise = '';

  onMount(() => {
    currentUser = getCurrentUser();
    if (currentUser) {
      user.set(currentUser);
      editForm = {
        name: currentUser.name,
        bio: currentUser.bio || '',
        expertise: currentUser.expertise || [],
        skillLevel: currentUser.skillLevel || ''
      };
    }
  });

  function startEditing() {
    isEditing = true;
    setError(null);
  }

  function cancelEditing() {
    isEditing = false;
    if (currentUser) {
      editForm = {
        name: currentUser.name,
        bio: currentUser.bio || '',
        expertise: currentUser.expertise || [],
        skillLevel: currentUser.skillLevel || ''
      };
    }
  }

  function addExpertise() {
    if (newExpertise.trim() && !editForm.expertise.includes(newExpertise.trim())) {
      editForm.expertise = [...editForm.expertise, newExpertise.trim()];
      newExpertise = '';
    }
  }

  function removeExpertise(index: number) {
    editForm.expertise = editForm.expertise.filter((_, i) => i !== index);
  }

  async function saveProfile() {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    try {
      const updatedUser = await updateUserProfile(currentUser.id, editForm);
      currentUser = updatedUser;
      user.set(updatedUser);
      isEditing = false;
    } catch (err) {
      setError(err instanceof Error ? err.message : '프로필 업데이트에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
  }

  function goToMentors() {
    setView('mentors');
  }

  function goToMatches() {
    setView('matches');
  }
</script>

<div class="profile-container">
  {#if currentUser}
    <div class="profile-header">
      <div class="profile-info">
        <h2>{currentUser.name}</h2>
        <span class="role-badge" class:mentor={currentUser.role === 'mentor'}>
          {currentUser.role === 'mentor' ? '멘토' : '멘티'}
        </span>
        <p class="email">{currentUser.email}</p>
      </div>
      
      <div class="profile-actions">
        {#if !isEditing}
          <button on:click={startEditing} class="btn-secondary">프로필 수정</button>
        {/if}
        <button on:click={handleLogout} class="btn-danger">로그아웃</button>
      </div>
    </div>

    {#if $error}
      <div class="error-message">{$error}</div>
    {/if}

    {#if isEditing}
      <div class="edit-form">
        <h3>프로필 수정</h3>
        
        <div class="form-group">
          <label for="name">이름</label>
          <input
            type="text"
            id="name"
            bind:value={editForm.name}
            placeholder="이름을 입력하세요"
            required
          />
        </div>

        <div class="form-group">
          <label for="bio">자기소개</label>
          <textarea
            id="bio"
            bind:value={editForm.bio}
            placeholder="자기소개를 입력하세요"
            rows="4"
          ></textarea>
        </div>

        {#if currentUser.role === 'mentor'}
          <div class="form-group">
            <label for="skillLevel">실력 수준</label>
            <select id="skillLevel" bind:value={editForm.skillLevel}>
              <option value="">선택하세요</option>
              <option value="BEGINNER">초급</option>
              <option value="INTERMEDIATE">중급</option>
              <option value="ADVANCED">고급</option>
              <option value="EXPERT">전문가</option>
            </select>
          </div>

          <div class="form-group">
            <label>전문 분야</label>
            <div class="expertise-input">
              <input
                type="text"
                bind:value={newExpertise}
                placeholder="전문 분야 추가"
                on:keypress={(e) => e.key === 'Enter' && addExpertise()}
              />
              <button type="button" on:click={addExpertise} class="btn-small">추가</button>
            </div>
            <div class="expertise-list">
              {#each editForm.expertise as expertise, index}
                <span class="expertise-tag">
                  {expertise}
                  <button on:click={() => removeExpertise(index)} class="remove-btn">&times;</button>
                </span>
              {/each}
            </div>
          </div>
        {/if}

        <div class="form-actions">
          <button on:click={saveProfile} disabled={$isLoading} class="btn-primary">
            {$isLoading ? '저장 중...' : '저장'}
          </button>
          <button on:click={cancelEditing} class="btn-secondary">취소</button>
        </div>
      </div>
    {:else}
      <div class="profile-details">
        {#if currentUser.bio}
          <div class="detail-section">
            <h4>자기소개</h4>
            <p>{currentUser.bio}</p>
          </div>
        {/if}

        {#if currentUser.role === 'mentor'}
          {#if currentUser.skillLevel}
            <div class="detail-section">
              <h4>실력 수준</h4>
              <p class="skill-level">{
                currentUser.skillLevel === 'BEGINNER' ? '초급' :
                currentUser.skillLevel === 'INTERMEDIATE' ? '중급' :
                currentUser.skillLevel === 'ADVANCED' ? '고급' :
                currentUser.skillLevel === 'EXPERT' ? '전문가' : currentUser.skillLevel
              }</p>
            </div>
          {/if}

          {#if currentUser.expertise && currentUser.expertise.length > 0}
            <div class="detail-section">
              <h4>전문 분야</h4>
              <div class="expertise-list">
                {#each currentUser.expertise as expertise}
                  <span class="expertise-tag">{expertise}</span>
                {/each}
              </div>
            </div>
          {/if}
        {/if}

        <div class="detail-section">
          <h4>가입일</h4>
          <p>{JSON.stringify(currentUser)}</p>
          <p>{new Date(currentUser.createdAt).toLocaleDateString('ko-KR')}</p>
        </div>
      </div>
    {/if}

    <div class="navigation-buttons">
      {#if currentUser.role === 'mentee'}
        <button on:click={goToMentors} class="btn-primary">멘토 찾기</button>
      {/if}
      <button on:click={goToMatches} class="btn-secondary">매칭 현황</button>
    </div>
  {:else}
    <div class="no-user">
      <p>로그인이 필요합니다.</p>
      <button on:click={() => setView('login')} class="btn-primary">로그인</button>
    </div>
  {/if}
</div>

<style>
  .profile-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  .profile-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #eee;
  }

  .profile-info h2 {
    margin: 0 0 0.5rem 0;
    color: #333;
  }

  .role-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background: #007bff;
    color: white;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .role-badge.mentor {
    background: #28a745;
  }

  .email {
    margin: 0.5rem 0 0 0;
    color: #666;
  }

  .profile-actions {
    display: flex;
    gap: 0.5rem;
  }

  .edit-form {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;
  }

  .edit-form h3 {
    margin: 0 0 1.5rem 0;
    color: #333;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #555;
  }

  input, select, textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    box-sizing: border-box;
  }

  textarea {
    resize: vertical;
    min-height: 100px;
  }

  .expertise-input {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .expertise-input input {
    flex: 1;
  }

  .expertise-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .expertise-tag {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    background: #e9ecef;
    border-radius: 12px;
    font-size: 0.875rem;
  }

  .remove-btn {
    background: none;
    border: none;
    color: #dc3545;
    margin-left: 0.5rem;
    cursor: pointer;
    font-weight: bold;
  }

  .form-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1.5rem;
  }

  .profile-details .detail-section {
    margin-bottom: 1.5rem;
  }

  .profile-details h4 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 1.1rem;
  }

  .skill-level {
    color: #007bff;
    font-weight: 500;
  }

  .navigation-buttons {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid #eee;
  }

  .no-user {
    text-align: center;
    padding: 4rem 2rem;
  }

  /* Button styles */
  .btn-primary, .btn-secondary, .btn-danger, .btn-small {
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

  .btn-danger {
    background: #dc3545;
    color: white;
  }

  .btn-danger:hover {
    background: #c82333;
  }

  .btn-small {
    background: #28a745;
    color: white;
    padding: 0.375rem 0.75rem;
    font-size: 0.8rem;
  }

  .btn-small:hover {
    background: #218838;
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
</style>
