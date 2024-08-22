import constants from "../helpers/constants.js"
import ses from "../helpers/ses.js"
import knex from "../config/mysql_db.js"
import fun from "../helpers/functions.js"

const getApproverEmailString = (supplier_name, status, approver_name, remarks, link_address, company_name)=>{
    const emailString = '<style>html,body { padding: 0; margin:0; }</style>'
    +'<div style="font-family:Arial,Helvetica,sans-serif; line-height: 1.5; font-weight: normal; font-size: 15px; color: #2F3044; min-height: 100%; margin:0; padding:0; width:100%; background-color:#edf2f7">'
        +'<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin:0 auto; padding:0; max-width:600px">'
            +'<tbody>'
                +'<tr>'
                    +'<td align="center" valign="center" style="text-align:center; padding: 40px">'
                            +'<img src="https://www.aeonx.digital/wp-content/uploads/2022/03/42.png" style="height: 100px" alt="logo">'
                                +'<tr>'
                                    +'<td align="left" valign="center">'
                                        +'<div style="text-align:left; margin: 0 20px; padding: 40px; background-color:#ffffff; border-radius: 6px">'
                                            +'<!--begin:Email content-->'
                                            +'<div style="padding-bottom: 30px; font-size: 17px;">'
                                                +'<strong> Hello, </strong>'
                                            +'</div>'
                                            +'<div style="padding-bottom: 30px"> Registration request of <b>'+supplier_name+'</b> for Supplier Onboarding Portal has been ' + status
                                            +' <br/></div>'
                                            +'<div style="padding-bottom: 30px">'
                                            +'Approver Name : '+approver_name+'<br>'
                                            +'Approver\'s Remarks : '+remarks
                                            +'</div>'
                                            +'<div style="padding-bottom: 30px">You can review this registration using below link:<br>'
                                            +'<a href='+ link_address +' rel="noopener" target="_blank" style="text-decoration:none;color: #009EF7">Click to view registration form</a></div>'
                                            +'<!--end:Email content-->'
                                            +'<div style="padding-bottom: 10px">Kind regards,'
                                            +'<br>'+company_name
                                            +'<tr>'
                                                +'<td align="center" valign="center" style="font-size: 13px; text-align:center;padding: 20px; color: #6d6e7c;">'
                                                    +'<p>'+constants.admindetails.address1+', </p>'
                                                    +'<p>'+constants.admindetails.address2+'</p>'
                                                    +'<p>Copyright © '+ company_name +'</p>'
                                                +'</td>'
                                            +'</tr></br></div>'
                                        +'</div>'
                                    +'</td>'
                                +'</tr>'
                                +'<tr align="center">'
                                    +'<td style="color:#0265d2"><b class="text-primary" >Note :</b> Do not reply to this email. This is auto-generated mail.</td>'
                                +'</tr>'
                            +'</img>'
                        +'</a>'
                    +'</td>'
                +'</tr>'
            +'</tbody>'
        +'</table>'
    +'</div>'
    return emailString;
}

export default{
    getApproverEmailString,
}