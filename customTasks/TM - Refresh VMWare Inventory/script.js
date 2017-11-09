importPackage(java.lang);
importPackage(java.util);
importPackage(com.cloupia.service.cIM.inframgr);

var milliseconds = 120000;

SystemScheduler.getInstance().runNow("VMWareInventoryCollector:" + input.VMWareCloud);

logger.addInfo("Starting timer for 120 sec");
Thread.sleep(milliseconds);
logger.addInfo(" timer Completed");