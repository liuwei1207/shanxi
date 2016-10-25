/**
 * Created by Liuwei on 2016/8/18.
 */
/**
 * form js for editRole
 */

$(document).ready(function () {
    var signupValidator = $("#editDeciceForm").validate({
        errorPlacement: function (error, element) {
            // Append error within linked label
            $(element)
                .after(error)
        },
        errorElement: "span",
        rules: {
            DeviceID: {
                required: true,
                minlength: 35,
                maxlength: 35
            },
            RegisterTagID: {
                required: true,
                minlength: 32,
                maxlength: 32
            },
            SiteID: {
                required: true,
                minlength: 8,
                maxlength: 8
            }
        },
        messages: {
            DeviceID: {
                required: "DeviceID不能为空",
                minlength: "站点编号满 35 位， 请重新输入!",
                maxlength: "站点编号超过 35 位， 请检查输入!"
            },
            RegisterTagID: {
                required: "RegisterTagID不能为空!",
                minlength: "站点编号满 32 位， 请重新输入!",
                maxlength: "站点编号超过 32 位， 请检查输入!"
            },
            SiteID: {
                required: "SiteID不能为空!",
                minlength: "站点名称不能小于2个字符!"
            }
        },
        invalidHandler: function () {
            return false;
        },
        submitHandler: function () {
            //表单的处理
            $.ajax({
                type: "POST",
                url: "/user/configuration/devices/editDevice",             //servlet
                dataType: "json",           //接受数据格式
                data: $("#editDeciceForm").serialize(),
                error: function (err) {
                    alert(err)
                },
                success: function (result) {
                    if (result == "true") {
                        $('#formInfoBox').find(".modal-body").html("站点编辑成功！");
                        $('#formInfoBox').modal();
                        $('#formInfoBox').on('hidden.bs.modal', function (e) {
                            window.location.href = "/user/configuration/devices"
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