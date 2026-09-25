import './setup-env.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parsePht,parseEqInfo,inputEvent} from '../server/src/ingestion.js';
import {deliveryFailure,retryDelay} from '../server/src/delivery.js';
import {policyReason,reviewNotificationEligible} from '../server/src/workflow.js';
test('PHT converts to UTC with midnight, noon and calendar validation',()=>{
 assert.equal(parsePht('24 September 2026 - 12:00 AM'),'2026-09-23T16:00:00.000Z');
 assert.equal(parsePht('24 Sep 2026 - 12:00:59 PM'),'2026-09-24T04:00:59.000Z');
 assert.throws(()=>parsePht('31 February 2026 - 01:00 PM'));assert.throws(()=>parsePht('24 Sep 2026 - 13:00 PM'));
});
test('EQInfo parser chooses newest bulletin and quarantines bad coordinates',()=>{
 const row=(bulletin:string,lat='10')=>`<tr><td><a href="2026_0924_0000_${bulletin}.html">24 September 2026 - 08:00 AM</a></td><td>${lat}</td><td>122</td><td>10</td><td>4.0</td><td>Test location</td></tr>`;
 const parsed=parseEqInfo(`<table>${row('B1')}${row('B2')}${row('B3','missing')}</table>`);
 assert.equal(parsed.events.length,1);assert.equal(parsed.events[0].bulletinNumber,2);assert.equal(parsed.rejected.length,1);
 assert.throws(()=>parseEqInfo('<html>Source layout changed</html>'));
 assert.throws(()=>inputEvent.parse({externalId:'bad',latitude:200}));
});
test('threshold equality is eligible; thresholds and felt requirements apply',()=>{
 const r={send_inside_aor_alert:true,minimum_magnitude:4,maximum_depth_km:50,station_distance_km:100,felt_event_required:false};
 assert.equal(policyReason(r,{magnitude:4,depth_km:50,station_distance_km:100}),null);
 assert.match(policyReason(r,{magnitude:3.9,depth_km:50,station_distance_km:100})!,/magnitude/);
 assert.match(policyReason({...r,felt_event_required:true},{magnitude:4,depth_km:50,station_distance_km:100})!,/verified felt/);
});
test('ambiguous SMTP errors are not blindly retried',()=>{
 assert.equal(deliveryFailure({code:'ETIMEDOUT'}),'UNCERTAIN');assert.equal(deliveryFailure({responseCode:451}),'RETRY');
 assert.equal(deliveryFailure({responseCode:550}),'FAILED');assert.equal(deliveryFailure({code:'ECONNECTION'}),'RETRY');
 assert.equal(retryDelay(1),30);assert.equal(retryDelay(3),120);assert.equal(retryDelay(20),3600);
});
test('review approvals cannot turn an outside AOR evaluation into an alert',()=>{
 assert.equal(reviewNotificationEligible('INSIDE'),true);assert.equal(reviewNotificationEligible('BOUNDARY'),true);
 assert.equal(reviewNotificationEligible('OVERLAP'),true);assert.equal(reviewNotificationEligible('OUTSIDE'),false);
 assert.equal(reviewNotificationEligible('UNRESOLVED'),false);
});
