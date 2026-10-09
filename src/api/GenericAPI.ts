import { APIRequestContext } from "@playwright/test";
import { BaseAPI } from "./BaseApi";

/**
 * A plain BaseAPI with no endpoint methods of its own.
 *
 * Hand-written tests use a service class like ProductAPI, where each
 * endpoint is a named method. Generated tests have no such class - the
 * paths come from the contract - so they call the verbs directly. BaseAPI
 * is abstract, which is why this concrete subclass exists.
 */
export class GenericAPI extends BaseAPI {
  constructor(request: APIRequestContext, baseURL: string) {
    super(request, baseURL);
  }
}
