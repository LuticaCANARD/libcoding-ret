<script lang="ts">
  import { login } from '../lib/auth';
  import { setUser, setError, setLoading, setView } from '../lib/store';
  import { isLoading, error } from '../lib/store';

  let email: string = '';
  let password: string = '';

  async function handleLogin(event: Event): Promise<void> {
    event.preventDefault(); // 추가 보안: 폼 제출 방지
    
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await login(email, password);
      setUser(result.user);
      setView('profile');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
      // 에러 발생 시에도 현재 페이지에 머물러 있음
    } finally {
      setLoading(false);
    }
  }

  function goToRegister(): void {
    setView('register');
  }
</script>

<div class="login-container">
  <div class="login-form">
    <h2>로그인</h2>
    
    {#if $error}
      <div class="error-message">{$error}</div>
    {/if}

    <form on:submit|preventDefault={handleLogin}>
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
          placeholder="비밀번호를 입력하세요"
          required
        />
      </div>

      <button type="submit" id="login" disabled={$isLoading}>
        {$isLoading ? '로그인 중...' : '로그인'}
      </button>
    </form>

    <div class="register-link">
      <p>계정이 없으신가요? <button on:click={goToRegister} class="link-button">회원가입</button></p>
    </div>
  </div>
</div>

<style>
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 60vh;
    padding: 2rem;
  }

  .login-form {
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

  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    box-sizing: border-box;
  }

  input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  button[type="submit"] {
    width: 100%;
    padding: 0.75rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    margin-top: 1rem;
  }

  button[type="submit"]:hover:not(:disabled) {
    background: #0056b3;
  }

  button[type="submit"]:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .register-link {
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
