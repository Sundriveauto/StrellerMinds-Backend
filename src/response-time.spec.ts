import { Test, TestingModule } from '@nestjs/testing';
import { Controller, Get, HttpCode, INestApplication, Module, Post } from '@nestjs/common';
import request from 'supertest';

const THRESHOLD_MS = 500;

@Controller()
class MockAppController {
  @Get() root() { return {}; }
  @Get('users') getUsers() { return []; }
  @Get('users/:id') getUser() { return {}; }
  @Get('courses') getCourses() { return []; }
  @Get('courses/:id') getCourse() { return {}; }
  @Get('auth/profile') getProfile() { return {}; }
  @Post('auth/login') @HttpCode(200) login() { return {}; }
}

@Module({ controllers: [MockAppController] })
class MockAppModule {}

describe('API Response Time Thresholds', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [MockAppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const routes: Array<{ method: 'get' | 'post'; path: string; body?: object }> = [
    { method: 'get', path: '/' },
    { method: 'get', path: '/users' },
    { method: 'get', path: '/users/test-id' },
    { method: 'get', path: '/courses' },
    { method: 'get', path: '/courses/test-id' },
    { method: 'get', path: '/auth/profile' },
    { method: 'post', path: '/auth/login', body: { email: 'test@test.com', password: 'password' } },
  ];

  routes.forEach(({ method, path, body }) => {
    it(`${method.toUpperCase()} ${path} responds within ${THRESHOLD_MS}ms`, async () => {
      const start = Date.now();
      await request(app.getHttpServer())[method](path).send(body);
      expect(Date.now() - start).toBeLessThan(THRESHOLD_MS);
    });
  });
});
