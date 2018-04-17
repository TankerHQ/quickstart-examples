//
//  DeviceValidationViewController.m
//  tanker-ui-demo
//
//  Created by Loic on 12/04/2018.
//  Copyright © 2018 Tanker. All rights reserved.
//

#import "DeviceValidationViewController.h"
#import "Globals.h"
@import PromiseKit;

@interface DeviceValidationViewController ()
@property (weak, nonatomic) IBOutlet UITextField *validationField;

@end

@implementation DeviceValidationViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (IBAction)pressContinue:(UIButton *)sender {
  NSString* unlockKey = _validationField.text;
  [[Globals sharedInstance].tanker unlockCurrentDeviceWithUnlockKey:unlockKey]
  .then(^{
    NSLog(@"Tanker is open");
  });
}

@end
