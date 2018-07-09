//
//  HomeViewController.m
//  tanker-ui-demo
//
//  Created by Loic on 09/07/2018.
//  Copyright © 2018 Tanker. All rights reserved.
//

#import "HomeViewController.h"
#import "Globals.h"

@import PromiseKit;

@interface HomeViewController()
@end

@implementation HomeViewController

- (IBAction)triggerLogout:(UIButton *)sender {
  [[Globals sharedInstance].tanker close].then(^{
    NSLog(@"Did log out");
    UIViewController *controller = [self.storyboard instantiateViewControllerWithIdentifier:@"home"];
    [self.navigationController pushViewController:controller animated:YES];
  }).catch(^(NSError* e){
    NSLog(@"Cannot close tanker %@", [e localizedDescription]);
  });
}

@end
