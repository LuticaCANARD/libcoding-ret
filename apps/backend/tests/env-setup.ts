// 테스트 실행 전에 .env.test 파일을 로드
import dotenv from 'dotenv';
import path from 'path';

// .env.test 파일 로드
dotenv.config({ 
  path: path.resolve(__dirname, '../.env.test'),
  override: true 
});
