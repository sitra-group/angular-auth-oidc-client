import { inject, Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { LoggerService } from '../../logging/logger.service';
import { CryptoService } from '../../utils/crypto/crypto.service';

@Injectable({ providedIn: 'root' })
export class RandomService {
  private readonly loggerService = inject(LoggerService);
  private readonly cryptoService = inject(CryptoService);

  encrypt(value: string): Observable<string> {
    return from(this.sha256Encrypt(value));
  }

  createRandom(
    requiredLength: number,
    configuration: OpenIdConfiguration
  ): string {
    if (requiredLength <= 0) {
      return '';
    }

    if (requiredLength > 0 && requiredLength < 7) {
      this.loggerService.logWarning(
        configuration,
        `RandomService called with ${requiredLength} but 7 chars is the minimum, returning 10 chars`
      );
      requiredLength = 10;
    }

    const length = requiredLength - 6;
    const arr = new Uint8Array(Math.floor(length / 2));
    const crypto = this.cryptoService.getCrypto();

    if (crypto) {
      crypto.getRandomValues(arr);
    }

    return Array.from(arr, this.toHex).join('') + this.randomString(7);
  }

  private async sha256Encrypt(value: string): Promise<string> {
    const crypto = this.cryptoService.getCrypto();
    const buffer = new TextEncoder().encode(value);
    const hashedBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const array = Array.from(new Uint8Array(hashedBuffer));
    
    return array.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private toHex(dec: number): string {
    return ('0' + dec.toString(16)).substr(-2);
  }

  private randomString(length: number): string {
    let result = '';
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = new Uint32Array(length);
    const crypto = this.cryptoService.getCrypto();

    if (crypto) {
      crypto.getRandomValues(values);
      for (let i = 0; i < length; i++) {
        result += characters[values[i] % characters.length];
      }
    }

    return result;
  }
}
