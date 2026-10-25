import path from 'path';
import dotenv from 'dotenv';
import app from './app';

// 프로젝트 루트 `.env` (OPENAI_API_KEY 등)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
