<script lang="ts">
  import { register } from '../lib/auth';
  import { setUser, setError, setLoading, setView } from '../lib/store';
  import { isLoading, error } from '../lib/store';

  let email = '';
  let password = '';
  let confirmPassword = '';
  let name = '';
  let role: 'mentor' | 'mentee' = 'mentee';

  async function handleRegister() {
    if (!email || !password || !name) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await register({ email, password, name, role });
      setUser(result.user);
      setView('profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function goToLogin() {
    setView('login');
  }
</script>

<div class="register-container">
  <div class="register-form">
    <h2>회원가입</h2>
    
    {#if $error}
      <div class="error-message">{$error}</div>
    {/if}

    <form on:submit|preventDefault={handleRegister}>
      <div class="form-group">
        <label for="name">이름</label>
        <input
          type="text"
          id="name"
          bind:value={name}
          placeholder="이름을 입력하세요"
          required
        />
      </div>

      <div class="form-group">
        <label for="email">이메일</label>
        <input
          type="email"
          id="email"
          bind:value={email}
          placeholder="이메일을 입력하세요"
          required
        />
      </div>

      <div class="form-group">
        <label for="password">비밀번호</label>
        <input
          type="password"
          id="password"
          bind:value={password}
          placeholder="비밀번호를 입력하세요 (최소 6자)"
          required
        />
      </div>

      <div class="form-group">
        <label for="confirmPassword">비밀번호 확인</label>
        <input
          type="password"
          id="confirmPassword"
          bind:value={confirmPassword}
          placeholder="비밀번호를 다시 입력하세요"
          required
        />
      </div>

      <div class="form-group">
        <label for="role">역할</label>
        <select id="role" bind:value={role}>
          <option value="mentee">멘티 (멘토링을 받고 싶어요)</option>
          <option value="mentor">멘토 (멘토링을 제공하고 싶어요)</option>
        </select>
      </div>

      <button type="submit" disabled={$isLoading}>
        {$isLoading ? '가입 중...' : '회원가입'}
      </button>
    </form>

    <div class="login-link">
      <p>이미 계정이 있으신가요? <button on:click={goToLogin} class="link-button">로그인</button></p>
    </div>
  </div>
</div>

<style>
  .register-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 60vh;
    padding: 2rem;
  }

  .register-form {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
  }

  h2 {
    text-align: center;
    margin-bottom: 1.5rem;
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

  input, select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    box-sizing: border-box;
  }

  input:focus, select:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  button[type="submit"] {
    width: 100%;
    padding: 0.75rem;
    background: #28a745;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    margin-top: 1rem;
  }

  button[type="submit"]:hover:not(:disabled) {
    background: #218838;
  }

  button[type="submit"]:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .login-link {
    text-align: center;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #eee;
  }

  .link-button {
    background: none;
    border: none;
    color: #007bff;
    text-decoration: underline;
    cursor: pointer;
    font-size: inherit;
  }

  .link-button:hover {
    color: #0056b3;
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
