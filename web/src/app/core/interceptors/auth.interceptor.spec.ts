import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { authInterceptor } from './auth.interceptor';
import { TokenStorageService } from '../services/token-storage.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokenStorage: jasmine.SpyObj<TokenStorageService>;

  beforeEach(() => {
    tokenStorage = jasmine.createSpyObj<TokenStorageService>('TokenStorageService', [
      'getToken',
      'clear'
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: TokenStorageService, useValue: tokenStorage },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('não injeta Bearer em rota pública de autocadastro', () => {
    tokenStorage.getToken.and.returnValue('jwt-token');

    http.post('/api/v1/nutricionistas/autocadastro', {}).subscribe();

    const req = httpMock.expectOne('/api/v1/nutricionistas/autocadastro');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ data: {}, message: 'ok' });
  });

  it('injeta Bearer em rota protegida', () => {
    tokenStorage.getToken.and.returnValue('jwt-token');

    http.get('/api/v1/usuarios/me').subscribe();

    const req = httpMock.expectOne('/api/v1/usuarios/me');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    req.flush({ data: {}, message: 'ok' });
  });
});
