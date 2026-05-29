import { fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { mockProvider } from '../../../test/auto-mock';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { LoggerService } from '../../logging/logger.service';
import { StoragePersistenceService } from '../../storage/storage-persistence.service';
import { PopupResult } from './popup-result';
import { PopUpService } from './popup.service';

describe('PopUpService', () => {
  let popUpService: PopUpService;
  let storagePersistenceService: StoragePersistenceService;
  let loggerService: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        mockProvider(StoragePersistenceService),
        mockProvider(LoggerService),
      ],
    });
  });

  beforeEach(() => {
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
    loggerService = TestBed.inject(LoggerService);
    popUpService = TestBed.inject(PopUpService);
  });

  let store: any = {};
  const mockStorage = {
    getItem: (key: string): string | null => {
      return key in store ? store[key] : null;
    },
    setItem: (key: string, value: string): void => {
      store[key] = `${value}`;
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
    length: 1,
    key: (_i: any): string => '',
  };

  it('should create', () => {
    expect(popUpService).toBeTruthy();
  });

  describe('isCurrentlyInPopup', () => {
    it('returns false if can not access Session Storage', () => {
      // arrange
      spyOn(popUpService as any, 'canAccessSessionStorage').and.returnValue(
        false
      );
      spyOnProperty(popUpService as any, 'windowInternal').and.returnValue({
        opener: {} as Window,
      });
      spyOn(storagePersistenceService, 'read').and.returnValue({
        popupauth: true,
      });
      const config = {} as OpenIdConfiguration;
      // act
      const result = popUpService.isCurrentlyInPopup(config);

      // assert
      expect(result).toBe(false);
    });

    it('returns false if window has no opener', () => {
      // arrange
      spyOn(popUpService as any, 'canAccessSessionStorage').and.returnValue(
        true
      );
      spyOn(storagePersistenceService, 'read').and.returnValue({
        popupauth: true,
      });
      const config = {} as OpenIdConfiguration;
      // act
      const result = popUpService.isCurrentlyInPopup(config);

      // assert
      expect(result).toBe(false);
    });

    it('returns false if there is no window available', () => {
      // arrange
      spyOn(popUpService as any, 'canAccessSessionStorage').and.returnValue(
        true
      );
      spyOnProperty(popUpService as any, 'windowInternal').and.returnValue(
        null
      );
      spyOn(storagePersistenceService, 'read').and.returnValue({
        popupauth: true,
      });
      const config = {} as OpenIdConfiguration;
      // act
      const result = popUpService.isCurrentlyInPopup(config);

      // assert
      expect(result).toBe(false);
    });

    it('returns false if there is no popup flag in storage', () => {
      // arrange
      spyOn(popUpService as any, 'canAccessSessionStorage').and.returnValue(
        true
      );
      spyOnProperty(popUpService as any, 'windowInternal').and.returnValue({
        opener: {} as Window,
      });
      spyOn(storagePersistenceService, 'read').and.returnValue(null);
      const config = {} as OpenIdConfiguration;
      // act
      const result = popUpService.isCurrentlyInPopup(config);

      // assert
      expect(result).toBe(false);
    });

    it('returns false if window is its own opener', () => {
      // arrange
      const windowMock: any = { opener: null };

      windowMock.opener = windowMock;
      spyOn(popUpService as any, 'canAccessSessionStorage').and.returnValue(
        true
      );
      spyOnProperty(popUpService as any, 'windowInternal').and.returnValue(
        windowMock
      );
      spyOn(storagePersistenceService, 'read').and.returnValue({
        popupauth: true,
      });
      const config = {} as OpenIdConfiguration;
      // act
      const result = popUpService.isCurrentlyInPopup(config);

      // assert
      expect(result).toBe(false);
    });

    it('returns true if isCurrentlyInPopup', () => {
      // arrange
      spyOn(popUpService as any, 'canAccessSessionStorage').and.returnValue(
        true
      );
      spyOnProperty(popUpService as any, 'windowInternal').and.returnValue({
        opener: {} as Window,
      });
      spyOn(storagePersistenceService, 'read').and.returnValue({
        popupauth: true,
      });
      const config = {} as OpenIdConfiguration;
      // act
      const result = popUpService.isCurrentlyInPopup(config);

      // assert
      expect(result).toBe(true);
    });
  });

  describe('result$', () => {
    it('emits when internal subject is called', waitForAsync(() => {
      // arrange
      const popupResult: PopupResult = {
        userClosed: false,
        receivedUrl: 'some-url1111',
      };

      // assert
      popUpService.result$.subscribe((result) => {
        expect(result).toBe(popupResult);
      });

      // act
      (popUpService as any).resultInternal$.next(popupResult);
    }));
  });

  describe('openPopup', () => {
    it('popup opens with parameters and default options', waitForAsync(() => {
      // arrange
      const popupSpy = spyOn(window, 'open').and.callFake(
        () =>
          ({
            closed: true,
            close: () => undefined,
          } as Window)
      );

      // act
      popUpService.openPopUp('url', {}, { configId: 'configId1' });

      // assert
      expect(popupSpy).toHaveBeenCalledOnceWith(
        'url',
        '_blank',
        jasmine.any(String)
      );
    }));

    it('popup opens with parameters and passed options', waitForAsync(() => {
      // arrange
      const popupSpy = spyOn(window, 'open').and.callFake(
        () =>
          ({
            closed: true,
            close: () => undefined,
          } as Window)
      );

      // act
      popUpService.openPopUp('url', { width: 100 }, { configId: 'configId1' });

      // assert
      expect(popupSpy).toHaveBeenCalledOnceWith(
        'url',
        '_blank',
        jasmine.any(String)
      );
    }));

    it('logs error and return if popup could not be opened', () => {
      // arrange
      spyOn(window, 'open').and.callFake(() => null);
      const loggerSpy = spyOn(loggerService, 'logError');

      // act
      popUpService.openPopUp('url', { width: 100 }, { configId: 'configId1' });

      // assert
      expect(loggerSpy).toHaveBeenCalledOnceWith(
        { configId: 'configId1' },
        'Could not open popup'
      );
    });

    it('logs error and does not open or write storage if url is empty', () => {
      // arrange
      const popupSpy = spyOn(window, 'open');
      const loggerSpy = spyOn(loggerService, 'logError');
      const writeSpy = spyOn(storagePersistenceService, 'write');

      // act
      popUpService.openPopUp('', {}, { configId: 'configId1' });

      // assert
      expect(loggerSpy).toHaveBeenCalledOnceWith(
        { configId: 'configId1' },
        'Could not open popup, url is empty'
      );
      expect(popupSpy).not.toHaveBeenCalled();
      expect(writeSpy).not.toHaveBeenCalled();
    });

    it('does nothing if there is no window available', () => {
      // arrange
      spyOnProperty(popUpService as any, 'windowInternal').and.returnValue(
        null
      );
      const writeSpy = spyOn(storagePersistenceService, 'write');

      // act
      popUpService.openPopUp('url', {}, { configId: 'configId1' });

      // assert
      expect(writeSpy).not.toHaveBeenCalled();
    });

    describe('popup closed', () => {
      let popup: Window;
      let popupResult: PopupResult;
      let cleanUpSpy: jasmine.Spy;

      beforeEach(() => {
        popup = {
          closed: false,
          close: () => undefined,
        } as Window;

        spyOn(window, 'open').and.returnValue(popup);

        cleanUpSpy = spyOn(popUpService as any, 'cleanUp').and.callThrough();

        popupResult = {} as PopupResult;

        popUpService.result$.subscribe((result) => (popupResult = result));
      });

      it('message received with data', fakeAsync(() => {
        // arrange
        let listener: (event: MessageEvent) => void = () => {
          return;
        };

        spyOn(window, 'addEventListener').and.callFake(
          (_: any, func: any) => (listener = func)
        );

        // act
        popUpService.openPopUp('url', {}, { configId: 'configId1' });

        expect(popupResult).toEqual({} as PopupResult);
        expect(cleanUpSpy).not.toHaveBeenCalled();

        listener(new MessageEvent('message', { data: 'some-url1111' }));

        tick(200);

        // assert
        expect(popupResult).toEqual({
          userClosed: false,
          receivedUrl: 'some-url1111',
        });
        expect(cleanUpSpy).toHaveBeenCalledOnceWith(listener, {
          configId: 'configId1',
        });
      }));

      it('message received without data does return but cleanup does not throw event', fakeAsync(() => {
        // arrange
        let listener: (event: MessageEvent) => void = () => {
          return;
        };

        spyOn(window, 'addEventListener').and.callFake(
          (_: any, func: any) => (listener = func)
        );
        const nextSpy = spyOn((popUpService as any).resultInternal$, 'next');

        // act
        popUpService.openPopUp('url', {}, { configId: 'configId1' });

        expect(popupResult).toEqual({} as PopupResult);
        expect(cleanUpSpy).not.toHaveBeenCalled();

        listener(new MessageEvent('message', { data: null }));

        tick(200);

        // assert
        expect(popupResult).toEqual({} as PopupResult);
        expect(cleanUpSpy).toHaveBeenCalled();
        expect(nextSpy).not.toHaveBeenCalled();
      }));

      it('message received without data does not clean up when disableCleaningPopupOnInvalidMessage is true', fakeAsync(() => {
        // arrange
        let listener: (event: MessageEvent) => void = () => {
          return;
        };

        spyOn(window, 'addEventListener').and.callFake(
          (_: any, func: any) => (listener = func)
        );
        const nextSpy = spyOn((popUpService as any).resultInternal$, 'next');

        // act
        popUpService.openPopUp(
          'url',
          {},
          {
            configId: 'configId1',
            disableCleaningPopupOnInvalidMessage: true,
          }
        );

        listener(new MessageEvent('message', { data: null }));

        // assert
        expect(cleanUpSpy).not.toHaveBeenCalled();
        expect(nextSpy).not.toHaveBeenCalled();

        // cleanup the interval started by openPopUp
        (popup as any).closed = true;
        tick(200);
      }));

      it('user closed', fakeAsync(() => {
        // arrange & act
        popUpService.openPopUp('url', undefined, { configId: 'configId1' });

        expect(popupResult).toEqual({} as PopupResult);
        expect(cleanUpSpy).not.toHaveBeenCalled();

        (popup as any).closed = true;

        tick(200);

        // assert
        expect(popupResult).toEqual({
          userClosed: true,
          receivedUrl: '',
        } as PopupResult);
        expect(cleanUpSpy).toHaveBeenCalled();
      }));
    });
  });

  describe('sendMessageToMainWindow', () => {
    it('does nothing if there is no window available', waitForAsync(() => {
      // arrange
      spyOnProperty(popUpService as any, 'windowInternal').and.returnValue(
        null
      );
      const sendMessageSpy = spyOn(popUpService as any, 'sendMessage');

      // act
      popUpService.sendMessageToMainWindow('someUrl', {
        configId: 'configId1',
      });

      // assert
      expect(sendMessageSpy).not.toHaveBeenCalled();
    }));

    it('does nothing if window.opener is null', waitForAsync(() => {
      // arrange
      spyOnProperty(window, 'opener').and.returnValue(null);

      const sendMessageSpy = spyOn(popUpService as any, 'sendMessage');

      // act
      popUpService.sendMessageToMainWindow('', {});

      // assert
      expect(sendMessageSpy).not.toHaveBeenCalled();
    }));

    it('calls postMessage when window opener is given', waitForAsync(() => {
      // arrange
      spyOnProperty(window, 'opener').and.returnValue({
        postMessage: () => undefined,
      });
      const sendMessageSpy = spyOn(window.opener, 'postMessage');

      // act
      popUpService.sendMessageToMainWindow('someUrl', {});

      // assert
      expect(sendMessageSpy).toHaveBeenCalledOnceWith(
        'someUrl',
        jasmine.any(String)
      );
    }));

    it('does not postMessage and logs debug when url is empty', waitForAsync(() => {
      // arrange
      spyOnProperty(window, 'opener').and.returnValue({
        postMessage: () => undefined,
      });
      const sendMessageSpy = spyOn(window.opener, 'postMessage');
      const loggerSpy = spyOn(loggerService, 'logDebug');

      // act
      popUpService.sendMessageToMainWindow('', { configId: 'configId1' });

      // assert
      expect(sendMessageSpy).not.toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalled();
    }));
  });

  describe('cleanUp', () => {
    it('does nothing if there is no window available', waitForAsync(() => {
      // arrange
      spyOnProperty(popUpService as any, 'windowInternal').and.returnValue(
        null
      );
      const removeSpy = spyOn(window, 'removeEventListener');
      const removeItemSpy = spyOn(storagePersistenceService, 'remove');

      // act
      (popUpService as any).cleanUp(null, { configId: 'configId1' });

      // assert
      expect(removeSpy).not.toHaveBeenCalled();
      expect(removeItemSpy).not.toHaveBeenCalled();
    }));

    it('calls removeEventListener on window with correct params', waitForAsync(() => {
      // arrange
      const spy = spyOn(window, 'removeEventListener').and.callFake(
        () => undefined
      );
      const listener: any = null;

      // act
      (popUpService as any).cleanUp(listener, { configId: 'configId1' });

      // assert
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledOnceWith('message', listener, false);
    }));

    it('removes popup from sessionstorage, closes and nulls when popup is opened', waitForAsync(() => {
      // arrange
      const popupMock = {
        anyThing: 'truthy',
        sessionStorage: mockStorage,
        close: (): void => undefined,
      };
      const removeItemSpy = spyOn(storagePersistenceService, 'remove');
      const closeSpy = spyOn(popupMock, 'close');

      // act
      (popUpService as any).popUp = popupMock;
      (popUpService as any).cleanUp(null, { configId: 'configId1' });

      // assert
      expect(removeItemSpy).toHaveBeenCalledOnceWith('popupauth', {
        configId: 'configId1',
      });
      expect(closeSpy).toHaveBeenCalledTimes(1);
      expect((popUpService as any).popUp).toBeNull();
    }));
  });

  describe('sendMessage', () => {
    it('does nothing if there is no window available', waitForAsync(() => {
      // arrange
      spyOnProperty(popUpService as any, 'windowInternal').and.returnValue(
        null
      );
      const loggerSpy = spyOn(loggerService, 'logDebug');
      // act
      const result = (popUpService as any).sendMessage('url', 'href', {
        configId: 'configId1',
      });

      // assert
      expect(result).toBeUndefined();
      expect(loggerSpy).not.toHaveBeenCalled();
    }));
  });

  describe('getOptions', () => {
    it('returns an empty string if there is no window available', () => {
      // arrange
      spyOnProperty(popUpService as any, 'windowInternal').and.returnValue(
        null
      );

      // act
      const result = (popUpService as any).getOptions({});

      // assert
      expect(result).toBe('');
    });

    it('falls back to default width and height when passed values are falsy', () => {
      // arrange
      const popupOptions = { width: 0, height: 0 };
      // act
      const result = (popUpService as any).getOptions(popupOptions);

      // assert
      expect(result).toContain('left=');
      expect(result).toContain('top=');
      expect(typeof result).toBe('string');
    });

    it('returns a comma separated, url-encoded options string', () => {
      // arrange
      const popupOptions = { width: 100, height: 200 };
      // act
      const result = (popUpService as any).getOptions(popupOptions);

      // assert
      expect(result).toContain('width=100');
      expect(result).toContain('height=200');
      expect(result.split(',').length).toBe(4);
    });
  });

  describe('canAccessSessionStorage', () => {
    it('returns a boolean based on navigator, cookies and Storage availability', () => {
      // act
      const result = (popUpService as any).canAccessSessionStorage();

      // assert
      expect(typeof result).toBe('boolean');
    });
  });
});
