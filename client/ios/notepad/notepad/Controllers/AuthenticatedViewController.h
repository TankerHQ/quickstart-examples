#import "BaseViewController.h"

NS_ASSUME_NONNULL_BEGIN

@interface AuthenticatedViewController : BaseViewController <UIBarPositioningDelegate>

@property BOOL navbarBackButton;
@property NSString* navbarTitle;

@end

NS_ASSUME_NONNULL_END
