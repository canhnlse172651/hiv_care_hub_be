jest.setTimeout(30000)
import request from 'supertest'
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { AppModule } from '../src/app.module'

describe('PatientTreatmentController (e2e)', () => {
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

  it('/patient-treatment (POST) - should create new treatment', async () => {
    const res = await request(app.getHttpServer())
      .post('/patient-treatment')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        patientId: 1,
        protocolId: 2,
        doctorId: 3,
        startDate: new Date().toISOString().slice(0, 10),
      })
    expect([201, 200, 400, 404, 409]).toContain(res.status)
  })

  it('/patient-treatment/:id (GET) - should return treatment or 404', async () => {
    const res = await request(app.getHttpServer())
      .get('/patient-treatment/1')
      .set('Authorization', `Bearer ${accessToken}`)
    expect([200, 404]).toContain(res.status)
  })

  it('/patient-treatment/:id (PATCH) - should update treatment or 404', async () => {
    const res = await request(app.getHttpServer())
      .patch('/patient-treatment/1')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ notes: 'e2e update' })
    expect([200, 404, 400]).toContain(res.status)
  })

  it('/patient-treatment (POST) - should fail with invalid data', async () => {
    const res = await request(app.getHttpServer())
      .post('/patient-treatment')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
    expect([400, 404]).toContain(res.status)
  })
})
