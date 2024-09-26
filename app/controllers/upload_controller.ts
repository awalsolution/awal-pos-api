import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import string from '@adonisjs/core/helpers/string'
import { BaseController } from '#controllers/base_controller'
import env from '#start/env'

export default class UploadController extends BaseController {
  async imageUploader(ctx: HttpContext) {
    try {
      const img: any = ctx.request.file('image')

      if (!img) {
        return ctx.response.badRequest({
          code: 400,
          message: 'No image file found in the request!',
          data: null,
        })
      }

      const newImg = img.clientName
      let url: string | null = null

      const tenantApiKey = ctx.request.header('X-Tenant-Api-Key')

      if (tenantApiKey) {
        const tenant: any = await this.isTenant(ctx)

        if (!tenant) {
          return ctx.response.unauthorized({
            code: 401,
            message: 'Invalid Org API key!',
            data: null,
          })
        }

        const tenantPath = `uploads/org_${string.snakeCase(tenant.tenant_name)}`

        const movePath = app.inProduction
          ? app.makePath(`../../${tenantPath}`)
          : app.makePath(`${env.get('LOCAL_DRIVE')}/${tenantPath}`)

        await img.move(movePath, { name: newImg })

        url = `/${tenantPath}/${newImg}`
      } else {
        const adminPath = 'uploads/admin'

        const movePath = app.inProduction
          ? app.makePath(`../../${adminPath}`)
          : app.makePath(`${env.get('LOCAL_DRIVE')}/${adminPath}`)

        await img.move(movePath, { name: newImg })

        url = `/${adminPath}/${newImg}`
      }

      if (!url) {
        return ctx.response.badRequest({
          code: 400,
          message: 'Image not uploaded, please try again!',
          data: null,
        })
      }

      ctx.response.ok({
        code: 200,
        message: 'Image uploaded successfully!',
        data: url,
      })
    } catch (error) {
      console.error('Image upload error:', error)
      ctx.response.internalServerError({
        code: 500,
        message: 'Internal server error during image upload!',
        data: null,
      })
    }
  }
}
