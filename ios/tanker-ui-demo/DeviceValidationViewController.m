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

/*
#pragma mark - Navigation

// In a storyboard-based application, you will often want to do a little preparation before navigation
- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender {
    // Get the new view controller using [segue destinationViewController].
    // Pass the selected object to the new view controller.
}
*/

@end
