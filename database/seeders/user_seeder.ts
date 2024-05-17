import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    await User.createMany([
      {
        email: 'iqbal@gmail.com',
        password: '123456',
      },
      {
        email: 'manager@gmail.com',
        password: '123456',
      },
    ])
  }
}
