 
importPackage(java.lang);
importPackage(com.cloupia.model.cIM);
importPackage(com.cloupia.lib.util.managedreports);
importPackage(com.cloupia.service.cIM.inframgr);
importPackage(com.cloupia.model.cIM);
 
var realvmname ='';

function getReport(reportContext, reportName){
     var report = null;
            try{
                 report = ctxt.getAPI().getConfigTableReport(reportContext, reportName);
                }catch(e)
                            {}
     if (report == null)
         {
         return ctxt.getAPI().getTabularReport(reportName, reportContext);
         }
            else {
            var source = report.getSourceReport();
                   return ctxt.getAPI().getTabularReport (source, reportContext);
            }
}
 
function getReportView(reportContext, reportName){
     var report = getReport(reportContext, reportName);
     if (report == null)
                 {
           logger.addError("No such report exists for the specified context "+reportName);
           return null;
                 }
     return new TableView(report);
}
 
 
function accessReports(filter){
 
 
          var reportName="TABULAR_REPORT_VMS_PAGINATED_CONFIG_REPORT";
          var repContext = util.createContextByType( "Global",null,null);
          var report = getReportView(repContext, reportName);
 

logger.addInfo("RowCount Before filter : " + report.rowCount());
 
logger.addInfo("Filtering VMs")
//
// true means reg ex filter
// Example:  (?i)PRD-TU-01
// will find the vmname PRD-tu-01
//
var filtered_report = report.filterRowsByColumn("VM Name", filter, true);
logger.addInfo("Total VMs after filtering: "+ String(filtered_report.rowCount()));

var ActualVMName =  filtered_report.getColumnValue(0, "VM Name");
logger.addInfo("Actual VM Name: "+ ActualVMName);

realvmname = ActualVMName;

return  filtered_report.rowCount(); 


}
var filter = String(input.RegExFilter + input.VMName);
//var filter = "(?i)PRD-tu-01";
logger.addInfo("User Input:"+ filter)
var out = accessReports(filter);
 
output.VMsFound = out;
output.ActualVMName = realvmname;

