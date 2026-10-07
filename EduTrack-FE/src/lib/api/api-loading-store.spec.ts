import { beforeEach, describe, expect, it } from 'vitest';
import {
  beginApiRequest,
  endApiRequest,
  getApiLoadingSnapshot,
} from './api-loading-store';

describe('api loading store', () => {
  beforeEach(() => {
    while (getApiLoadingSnapshot()) endApiRequest();
  });

  it('stays visible until all concurrent requests finish', () => {
    beginApiRequest();
    beginApiRequest();
    endApiRequest();
    expect(getApiLoadingSnapshot()).toBe(true);
    endApiRequest();
    expect(getApiLoadingSnapshot()).toBe(false);
  });

  it('never decrements below zero', () => {
    endApiRequest();
    expect(getApiLoadingSnapshot()).toBe(false);
  });
});
