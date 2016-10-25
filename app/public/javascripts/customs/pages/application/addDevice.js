/**
 * Created by Liuwei on 2016/8/18.
 */
/**
 * form js for addUser
 */

$(document).ready(function () {
    var signupValidator = $("#addDeciceForm").validate({
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
                maxlength: 35,
                remote: {  //验证RegisterTagID是否存在
                    type: "POST",
                    url: "/user/configuration/devices/checkDeviceID",             //servlet
                    dataType: "json",           //接受数据格式
                    data: {
                        captcha: function () {
                            return $("#ipt_DeviceID").val();
                        }
                    }
                }
            },
            RegisterTagID: {
                required: true,
                minlength: 32,
                maxlength: 32,
                remote: {  //验证RegisterTagID是否存在
                    type: "POST",
                    url: "/user/configuration/devices/checkRegisterTagID",             //servlet
                    dataType: "json",           //接受数据格式
                    data: {
                        captcha: function () {
                            return $("#ipt_RegisterTagID").val();
                        }
                    }
                }
            },
            SiteID: {
                required: true,
                minlength: 8,
                maxlength: 8
            }
        },
        messages: {
            DeviceID: {
                required: "设备ID不能为空",
                minlength: "设备ID不满 35 位， 请重新输入!",
                maxlength: "设备ID超过 35 位， 请检查输入!",
                remote: "设备ID已存在， 请重新输入！"
            },
            RegisterTagID: {
                required: "Tag值不能为空",
                minlength: "Tag值不满 32 位， 请重新输入!",
                maxlength: "Tag值超过 32 位， 请检查输入!",
                remote: "Tag值已存在， 请重新输入！"
            },
            SiteID: {
                required: "请选择所属站点！",
                minlength: "所属站点ID不满 8 位， 请重新输入!",
                maxlength: "所属站点ID超过 8 位， 请检查输入!"
            }
        },
        invalidHandler: function () {
            return false;
        },
        submitHandler: function () {
            //表单的处理
            $.ajax({
                type: "POST",
                url: "/user/configuration/devices/addDevice",             //servlet
                dataType: "json",           //接受数据格式
                data: $("#addDeciceForm").serialize(),
                error: function (err) {
                    alert(err)
                },
                success: function (result) {
                    if (result == "true") {
                        $('#formInfoBox').find(".modal-body").html("设备新建成功！");
                        $('#formInfoBox').modal();
                        $('#formInfoBox').on('hidden.bs.modal', function (e) {
                            window.location.href = "/user/configuration/devices"
                        })
                    }
                    if (result == "false") {
                        $('#formInfoBox').find(".modal-body").html("设备新建失败！");
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


$(document).ready(function () {
    generateRandom();
    function generateRandom() {
        var num = Math.floor(Math.random() * 100000000);
        var str = String(num);
        while (str.length < 8) {
            str = str + "0";
        }
        $("#ipt_ProjNum").val(str)
    }

    $(".btn-reset").on("click", function () {
        generateRandom();
    })
});