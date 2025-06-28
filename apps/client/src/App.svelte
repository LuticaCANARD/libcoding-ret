<script lang="ts">
  let count: number = 0
  const increment = () => {
    count += 1
  }
</script>

<main>
  <div>
    <h1>멘토-멘티 매칭 플랫폼</h1>

    <div class="card">
      <button on:click={increment}>
        count is {count}
      </button>
      <p>
        환경설정이 완료되었습니다!<br />
        이제 실제 기능을 구현할 준비가 되었습니다.
      </p>
    </div>

    <p class="read-the-docs">
      OpenAPI 스펙을 기반으로 멘토-멘티 매칭 시스템을 구현합니다.
    </p>
  </div>
</main>

<style>
  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.svelte:hover {
    filter: drop-shadow(0 0 2em #ff3e00aa);
  }
  .read-the-docs {
    color: #888;
  }
</style>
