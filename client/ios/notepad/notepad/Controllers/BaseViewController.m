#import "BaseViewController.h"

@interface BaseViewController ()

@end

@implementation BaseViewController

- (void)viewDidLoad {
  [super viewDidLoad];
}

- (Session *)session {
  return [Session sharedSession];
}

@end

