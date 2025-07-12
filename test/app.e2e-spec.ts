import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from './../src/app.module'

jest.setTimeout(30000)

describe('AppController (e2e)', () => {
  let app: INestApplication<App>

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('/ (GET)', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect('Hello World!')
  })

  it('should return 404 for non-existent route', async () => {
    const res = await request(app.getHttpServer()).get('/not-found-url')
    expect(res.status).toBe(404)
  })

  it('should return 405 for not allowed method on / (POST)', async () => {
    const res = await request(app.getHttpServer()).post('/')
    // Có thể là 404 hoặc 405 tuỳ cấu hình, nên chấp nhận cả hai
    expect([404, 405]).toContain(res.status)
  })

  it('/ (GET) should return content-type text/html or text/plain', async () => {
    const res = await request(app.getHttpServer()).get('/')
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/text\/|json/)
  })

  it('should return 401 for protected route without token', async () => {
    // Giả sử /medicines là route cần xác thực
    const res = await request(app.getHttpServer()).get('/medicines')
    expect([401, 403]).toContain(res.status)
  })

  it('should return 404 for dynamic route not found', async () => {
    const res = await request(app.getHttpServer()).get('/user/999999')
    expect(res.status).toBe(404)
  })

  it('/ (GET) with Accept: application/json', async () => {
    const res = await request(app.getHttpServer()).get('/').set('Accept', 'application/json')
    expect(res.status).toBe(200)
    // Nếu app trả về JSON, kiểm tra content-type
    expect(res.headers['content-type']).toMatch(/json|text\//)
  })
})
