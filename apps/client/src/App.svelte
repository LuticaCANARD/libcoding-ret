<script lang="ts">
  import { onMount } from 'svelte';
  import { currentView, user, setView, setUser } from './lib/store';
  import { getCurrentUser, isAuthenticated } from './lib/auth';
  import Login from './components/Login.svelte';
  import Register from './components/Register.svelte';
  import Profile from './components/Profile.svelte';
  import MentorList from './components/MentorList.svelte';
  import Matches from './components/Matches.svelte';

  onMount(() => {
    // Check if user is authenticated on app start
    if (isAuthenticated()) {
      const userData = getCurrentUser();
      if (userData) {
        setUser(userData);
        setView('profile');
      }
    } else {
      setView('home');
    }
  });

  function goToLogin() {
    setView('login');
  }

  function goToRegister() {
    setView('register');
  }
</script>

<main>
  <header class="app-header">
    <div class="header-content">
      <h1>멘토-멘티 매칭 플랫폼</h1>
      {#if $user}
        <div class="user-info">
          <span>안녕하세요, {$user.name}님!</span>
          <span class="role-badge" class:mentor={$user.role === 'mentor'}>
            {$user.role === 'mentor' ? '멘토' : '멘티'}
          </span>
        </div>
      {/if}
    </div>
  </header>

  <div class="app-content">
    {#if $currentView === 'home'}
      <div class="home-page">
        <div class="hero-section">
          <h2>전문가와 함께 성장하세요</h2>
          <p>경험 많은 멘토들과 연결되어 새로운 기술을 배우고 성장할 수 있습니다.</p>
          
          <div class="cta-buttons">
            <button on:click={goToLogin} class="btn-primary">로그인</button>
            <button on:click={goToRegister} class="btn-secondary">회원가입</button>
          </div>
        </div>

        <div class="features-section">
          <h3>주요 기능</h3>
          <div class="features-grid">
            <div class="feature-card">
              <h4>🎯 전문 분야별 멘토 찾기</h4>
              <p>프로그래밍, 디자인, 비즈니스 등 다양한 분야의 전문가들을 만나보세요.</p>
            </div>
            <div class="feature-card">
              <h4>💬 1:1 매칭 시스템</h4>
              <p>개인의 목표와 수준에 맞는 멘토와 직접 연결됩니다.</p>
            </div>
            <div class="feature-card">
              <h4>📈 체계적인 성장 관리</h4>
              <p>멘토링 진행 상황을 체계적으로 관리하고 성장을 추적할 수 있습니다.</p>
            </div>
          </div>
        </div>
      </div>
    {:else if $currentView === 'login'}
      <Login />
    {:else if $currentView === 'register'}
      <Register />
    {:else if $currentView === 'profile'}
      <Profile />
    {:else if $currentView === 'mentors'}
      <MentorList />
    {:else if $currentView === 'matches'}
      <Matches />
    {:else}
      <div class="error-page">
        <h2>페이지를 찾을 수 없습니다</h2>
        <button on:click={() => setView('home')} class="btn-primary">홈으로 돌아가기</button>
      </div>
    {/if}
  </div>

  <footer class="app-footer">
    <div class="footer-content">
      <p>&copy; 2024 멘토-멘티 매칭 플랫폼. 함께 성장하는 커뮤니티.</p>
    </div>
  </footer>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: #f8f9fa;
    color: #333;
    line-height: 1.6;
  }

  :global(*) {
    box-sizing: border-box;
  }

  main {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .app-header {
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
    color: white;
    padding: 1rem 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-content h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .role-badge {
    background: rgba(255, 255, 255, 0.2);
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .role-badge.mentor {
    background: rgba(40, 167, 69, 0.8);
  }

  .app-content {
    flex: 1;
    min-height: calc(100vh - 120px);
  }

  .home-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .hero-section {
    text-align: center;
    padding: 4rem 2rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    margin-bottom: 4rem;
  }

  .hero-section h2 {
    font-size: 2.5rem;
    margin: 0 0 1rem 0;
    color: #333;
    font-weight: 700;
  }

  .hero-section p {
    font-size: 1.2rem;
    color: #666;
    margin: 0 0 2rem 0;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }

  .cta-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .features-section {
    text-align: center;
  }

  .features-section h3 {
    font-size: 2rem;
    margin: 0 0 2rem 0;
    color: #333;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
  }

  .feature-card {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    text-align: left;
  }

  .feature-card h4 {
    margin: 0 0 1rem 0;
    color: #333;
    font-size: 1.25rem;
  }

  .feature-card p {
    margin: 0;
    color: #666;
    line-height: 1.6;
  }

  .error-page {
    text-align: center;
    padding: 4rem 2rem;
  }

  .error-page h2 {
    margin: 0 0 2rem 0;
    color: #dc3545;
  }

  .app-footer {
    background: #333;
    color: white;
    padding: 1rem 0;
    margin-top: auto;
  }

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    text-align: center;
  }

  .footer-content p {
    margin: 0;
    font-size: 0.875rem;
    opacity: 0.8;
  }

  /* Button styles */
  .btn-primary, .btn-secondary {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
    transition: all 0.2s;
  }

  .btn-primary {
    background: #007bff;
    color: white;
  }

  .btn-primary:hover {
    background: #0056b3;
    transform: translateY(-1px);
  }

  .btn-secondary {
    background: white;
    color: #007bff;
    border: 2px solid #007bff;
  }

  .btn-secondary:hover {
    background: #007bff;
    color: white;
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }

    .header-content h1 {
      font-size: 1.25rem;
    }

    .hero-section {
      padding: 2rem 1rem;
    }

    .hero-section h2 {
      font-size: 2rem;
    }

    .hero-section p {
      font-size: 1rem;
    }

    .cta-buttons {
      flex-direction: column;
      align-items: center;
    }

    .btn-primary, .btn-secondary {
      width: 100%;
      max-width: 200px;
    }

    .features-grid {
      grid-template-columns: 1fr;
    }

    .home-page {
      padding: 1rem;
    }
  }
</style>
