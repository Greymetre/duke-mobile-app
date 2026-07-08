#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(FieldKonnectNotifications, NSObject)

RCT_EXTERN_METHOD(requestAuthorization:
                  (RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(showNotification:
                  (NSString *)title
                  message:(NSString *)message
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
