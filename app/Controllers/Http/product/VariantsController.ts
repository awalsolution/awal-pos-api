import { BaseController } from 'App/Controllers/BaseController';
import HttpCodes from 'App/Enums/HttpCodes';
import Variation from 'App/Models/product/Variant';

export default class VariantsController extends BaseController {
  public MODEL: typeof Variation;
  constructor() {
    super();
    this.MODEL = Variation;
  }

  // find Variation list
  public async findAllRecords({ request, response }) {
    let DQ = this.MODEL.query();

    const page = request.input('page');
    const perPage = request.input('perPage');

    // name filter
    if (request.input('name')) {
      DQ = DQ.whereILike('name', request.input('name') + '%');
    }

    if (!DQ) {
      return response.notFound({
        code: HttpCodes.NOT_FOUND,
        message: 'Variations Data is Empty',
      });
    }

    if (perPage) {
      return response.ok({
        code: HttpCodes.SUCCESS,
        result: await DQ.preload('products')
          .preload('attributes')
          .preload('images')
          .paginate(page, perPage),
        message: 'Variation find Successfully',
      });
    } else {
      return response.ok({
        code: HttpCodes.SUCCESS,
        result: await DQ.preload('products')
          .preload('attributes')
          .preload('images'),
        message: 'Variation find Successfully',
      });
    }
  }

  // find variant using id
  public async findSingleRecord({ request, response }) {
    try {
      const DQ = await this.MODEL.query()
        .where('id', request.param('id'))
        .preload('products')
        .preload('attributes')
        .preload('images')
        .first();

      if (!DQ) {
        return response.notFound({
          code: HttpCodes.NOT_FOUND,
          message: 'Product Data is Empty',
        });
      }

      return response.ok({
        code: HttpCodes.SUCCESS,
        message: 'Variation find Successfully',
        result: DQ,
      });
    } catch (e) {
      return response.internalServerError({
        code: HttpCodes.SERVER_ERROR,
        message: e.toString(),
      });
    }
  }

  public async getVariantsByProduct({ request, response }) {
    try {
      const DQ = await this.MODEL.query()
        .where('product_id', request.param('id'))
        .preload('attributes')
        .preload('images');

      return response.ok({
        code: HttpCodes.SUCCESS,
        message: 'Product Variants find Successfully',
        result: DQ,
      });
    } catch (e) {
      return response.internalServerError({
        code: HttpCodes.SERVER_ERROR,
        message: e.toString(),
      });
    }
  }

  // create new variant
  public async create({ request, response }) {
    try {
      const DE = await this.MODEL.findBy('sku_id', request.body().sku_id);

      if (DE) {
        return response.conflict({
          code: HttpCodes.CONFLICTS,
          message: 'Variation already exists!',
        });
      }

      const DM = new this.MODEL();
      DM.productId = request.param('id');
      DM.attributeId = request.body().attribute_id;
      DM.sku_id = request.body().sku_id;
      DM.attribute_value = request.body().attribute_value;
      DM.price = request.body().price;
      DM.regular_price = request.body().regular_price;
      DM.status = request.body().status;
      DM.stock_quantity = request.body().stock_quantity;
      DM.stock_status = request.body().stock_status;
      DM.rating = request.body().rating;

      await DM.save();
      const images = request.body().images;
      for (const image of images) {
        await DM.related('images').create(image);
      }

      return response.ok({
        code: HttpCodes.SUCCESS,
        message: 'Variant Created Successfully!',
        result: DM,
      });
    } catch (e) {
      console.log(e);
      return response.internalServerError({
        code: HttpCodes.SERVER_ERROR,
        message: e.toString(),
      });
    }
  }

  // update product using id
  public async update({ request, response }) {
    try {
      const DQ = await this.MODEL.findBy('id', request.param('id'));
      if (!DQ) {
        return response.notFound({
          code: HttpCodes.NOT_FOUND,
          message: 'variant does not exists!',
        });
      }
      DQ.sku_id = request.body().sku_id;
      DQ.attribute_value = request.body().attribute_value;
      DQ.price = request.body().price;
      DQ.regular_price = request.body().regular_price;
      DQ.status = request.body().status;
      DQ.stock_quantity = request.body().stock_quantity;
      DQ.stock_status = request.body().stock_status;
      DQ.rating = request.body().rating;
      await DQ.save();
      const images = request.body().images;
      for (const image of images) {
        if (image.id) {
          const existImg = await DQ.related('images')
            .query()
            .where('id', image.id)
            .first();

          if (existImg) {
            // update image
            existImg.merge(image);
          }
        } else {
          // Create new image
          await DQ.related('images').create(image);
        }
      }
      return response.ok({
        code: HttpCodes.SUCCESS,
        message: 'Variant updated successfully!',
        result: DQ,
      });
    } catch (e) {
      console.log(e);
      return response.internalServerError({
        code: HttpCodes.SERVER_ERROR,
        message: e.message,
      });
    }
  }

  // delete variant using id
  public async destroy({ request, response }) {
    const DQ = await this.MODEL.findBy('id', request.param('id'));
    if (!DQ) {
      return response.notFound({
        code: HttpCodes.NOT_FOUND,
        message: 'Variant not found',
      });
    }
    await DQ.delete();
    return response.ok({
      code: HttpCodes.SUCCESS,
      result: { message: 'Variant deleted successfully' },
    });
  }
}
