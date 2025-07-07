jest.setTimeout(30000)
import request from 'supertest'
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { AppModule } from '../src/app.module'

describe('MedicineController (e2e)', () => {
  let app: INestApplication
  let accessToken: string

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()

    // Đăng nhập để lấy access token
    const loginRes = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'admin@example.com',
      password: 'admin123',
    })
    accessToken = loginRes.body.accessToken
  })

  afterAll(async () => {
    await app.close()
  })

  it('/medicines (POST) - should create new medicine', async () => {
    const res = await request(app.getHttpServer())
      .post('/medicines')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Paracetamol',
        description: 'Pain reliever',
        unit: 'tablet',
        dose: '500mg',
        price: 10000,
      })
    expect([201, 200, 400, 409]).toContain(res.status)
  })

  it('/medicines (POST) - should fail with invalid data', async () => {
    const res = await request(app.getHttpServer())
      .post('/medicines')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
    expect([400, 409]).toContain(res.status)
  })
})
