import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Product from 'App/Models/product/Product';
import { BaseController } from 'App/Controllers/BaseController';
import HttpCodes from 'App/Enums/HttpCodes';
import Pagination from 'App/Enums/Pagination';

export default class ProductsController extends BaseController {
  public MODEL: typeof Product;
  constructor() {
    super();
    this.MODEL = Product;
  }
  // find Product list
  public async find({ request, response }: HttpContextContract) {
    let data = this.MODEL.query();
    if (!data) {
      return response.notFound({
        code: HttpCodes.NOT_FOUND,
        message: 'Products Data is Empty',
      });
    }
    return response.ok({
      code: HttpCodes.SUCCESS,
      result: await data
        .preload('variations', (sub_relation) => {
          sub_relation.preload('attributes');
        })
        .preload('shop')
        .paginate(
          request.input(Pagination.PAGE_KEY, Pagination.PAGE),
          request.input(Pagination.PER_PAGE_KEY, Pagination.PER_PAGE)
        ),
      message: 'Products find Successfully',
    });
  }
  // find Product using id
  public async get({ request, response }: HttpContextContract) {
    try {
      const data = await this.MODEL.query()
        .where('id', request.param('id'))
        .preload('variations', (sub_relation) => {
          sub_relation.preload('attributes');
        })
        .preload('shop')
        .first();

      return response.ok({
        code: HttpCodes.SUCCESS,
        message: 'Product find Successfully',
        result: data,
      });
    } catch (e) {
      return response.internalServerError({
        code: HttpCodes.SERVER_ERROR,
        message: e.toString(),
      });
    }
  }
  // create new product
  public async create({ auth, request, response }: HttpContextContract) {
    try {
      const dataExists = await this.MODEL.findBy(
        'product_sku',
        request.body().product_sku
      );
      if (dataExists) {
        return response.conflict({
          code: HttpCodes.CONFLICTS,
          message: 'Product already exists!',
        });
      }
      const product = new this.MODEL();
      product.shopId = auth.user?.shop.id;
      product.categoryId = request.body().category_id;
      product.product_sku = request.body().product_sku;
      product.title = request.body().title;
      product.description = request.body().description;
      product.status = request.body().status;
      product.price = request.body().price;
      product.regular_price = request.body().regular_price;
      product.stock_quantity = request.body().stock_quantity;
      product.stock_status = request.body().stock_status;
      product.product_images = request.body().product_images;

      await product.save();
      await product.related('variations').createMany(request.body().variations);

      return response.ok({
        code: HttpCodes.SUCCESS,
        message: 'Product Created Successfully!',
        result: product,
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
  public async update({ request, response }: HttpContextContract) {
    try {
      const product = await this.MODEL.findBy('id', request.param('id'));
      if (!product) {
        return response.notFound({
          code: HttpCodes.NOT_FOUND,
          message: 'Product does not exists!',
        });
      }

      product.title = request.body().title;
      product.categoryId = request.body().category_id;
      product.product_sku = request.body().product_sku;
      product.description = request.body().description;
      product.status = request.body().status;
      product.price = request.body().price;
      product.regular_price = request.body().regular_price;
      product.stock_quantity = request.body().stock_quantity;
      product.stock_status = request.body().stock_status;
      product.product_images = request.body().product_images;

      await product.save();
      const variations = request.body().variations;
      for (const variation of variations) {
        if (variation.id) {
          const existingVariation = await product
            .related('variations')
            .query()
            .where('id', variation.id)
            .first();

          if (existingVariation) {
            // Update existing variation
            existingVariation.merge(variation);
            await existingVariation.save();
          }
        } else {
          // Create new variation
          await product.related('variations').create(variation);
        }
      }

      return response.ok({
        code: HttpCodes.SUCCESS,
        message: 'Product updated Successfully!',
        result: product,
      });
    } catch (e) {
      console.log(e);
      return response.internalServerError({
        code: HttpCodes.SERVER_ERROR,
        message: e.message,
      });
    }
  }
  //update product status
  // public async updateProductStatus({ request, response }: HttpContextContract) {
  //   const data = await this.MODEL.findBy('id', request.param('id'));
  //   if (!data) {
  //     return response.notFound({
  //       code: HttpCodes.NOT_FOUND,
  //       message: 'Product not found',
  //     });
  //   }
  //   data.is_active = request.body().is_active;
  //   await data.save();
  //   return response.ok({
  //     code: HttpCodes.SUCCESS,
  //     result: { message: 'Product Status Update successfully' },
  //   });
  // }

  // delete shop using id
  public async destroy({ request, response }: HttpContextContract) {
    const data = await this.MODEL.findBy('id', request.param('id'));
    if (!data) {
      return response.notFound({
        code: HttpCodes.NOT_FOUND,
        message: 'Product not found',
      });
    }
    await data.delete();
    return response.ok({
      code: HttpCodes.SUCCESS,
      result: { message: 'Product deleted successfully' },
    });
  }
}
