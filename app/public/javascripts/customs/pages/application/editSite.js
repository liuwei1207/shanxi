/**
 * Created by Liuwei on 2016/8/18.
 */
/**
 * form js for editRole
 */

$(document).ready(function () {
    var signupValidator = $("#editSiteForm").validate({
        errorPlacement: function (error, element) {
            // Append error within linked label
            $(element)
                .after(error)
        },
        errorElement: "span",
        rules: {
            SiteNum: {
                required: true,
                minlength: 8,
                maxlength: 8,
            },
            SiteName: {
                required: true,
                minlength: 2
            },
            ContactMobile: {
                required: false
            },
            ContactTel: {
                required: false
            },
            ContactEmail: {
                required: false
            },
            OHNotes: {
                required: false
            }
        },
        messages: {
            SiteNum: {
                required: "站点编号不能为空",
                minlength: "站点编号满 8 位， 请重新输入!",
                maxlength: "站点编号超过 8 位， 请检查输入!"
            },
            SiteName: {
                required: "站点名称不能为空!",
                minlength: "站点名称不能小于2个字符!",
            }
        },
        invalidHandler: function () {
            return false;
        },
        submitHandler: function () {
            //表单的处理
            $.ajax({
                type: "POST",
                url: "/user/configuration/sites/editSite",             //servlet
                dataType: "json",           //接受数据格式
                data: $("#editSiteForm").serialize(),
                error: function (err) {
                    alert(err)
                },
                success: function (result) {
                    if (result == "true") {
                        $('#formInfoBox').find(".modal-body").html("站点编辑成功！");
                        $('#formInfoBox').modal();
                        $('#formInfoBox').on('hidden.bs.modal', function (e) {
                            window.location.href = "/user/configuration/sites"
                        })
                    }
                    if (result == "false") {
                        $('#formInfoBox').find(".modal-body").html("站点编辑失败！");
                        $('#formInfoBox').modal();
                        $('#formInfoBox').on('hidden.bs.modal', function (e) {
                            signupValidator.resetForm();
                        })
                    }
                }
            });
            return false;//阻止表单提交
        }
    });

    $("#signupReset").click(function () {
        signupValidator.resetForm();
    });
});