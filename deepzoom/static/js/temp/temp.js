// $(async () => {
    var Viewer = async (viewerId, imageType, serveEndPoint) => {
        'use strict'
    
        const V = {
          slides: [],
          slide: {},
          pathology_id: '',
          viewer: null,
          annotations: [],
          annotation: {},
          isShowAnnotation: true,
          isShowAnnoLabel: true,
          isShowLabelWindow: true,
          slideName: '',
          currentImageIdx: -1,
          id: '',
          slideMpp: null,
          slideMagnification: null,
          lenghUnit: 'μm',
          annotationPlugin: null,
          serveEndPoint: serveEndPoint,
          imageType: imageType,
          counter: 1,
    
          setEvent: () => {
    
            let btnToggle = $('#btnAnnoShowHide' + V.imageType);
            if (!V.isShowAnnotation) btnToggle.removeClass("btn-primary").addClass("btn-basic");
    
            btnToggle.on('click', function () {
              if (V.isShowAnnotation) {
                // V.viewer.clearOverlays()
                V.justHideAnnotations()
                // $('#annotations>li').remove()
    
                $(this).addClass("btn-basic").removeClass("btn-primary");
                $(this).css('border', '1px solid #dd0');
                //          btnToggle.text('Hide Annotation Label');
                V.isShowAnnotation = false
              } else {
                // V.viewer.clearOverlays()
                V.justShowAnnotations()
    
                $(this).addClass("btn-primary").removeClass("btn-basic");
                $(this).css('border', '1px solid gray');
                //          btnToggle.text('Show Annotation Label');
                V.isShowAnnotation = true
              }
            })
    
            let btnAnnoLabelToggle = $('#btnAnnoLabelShowHide' + V.imageType);
            if (!V.isShowAnnoLabel) btnAnnoLabelToggle.removeClass("btn-primary").addClass("btn-basic");
    
            btnAnnoLabelToggle.on('click', function () {
              if (V.isShowAnnoLabel) {
                $(".anno-label").addClass('hide').removeClass('show');
    
                $(this).addClass("btn-basic").removeClass("btn-primary");
                $(this).css('border', '1px solid #dd0');
                V.isShowAnnoLabel = false;
              } else {
                V.isShowAnnoLabel = true;
                $(".anno-label").addClass('show').removeClass('hide');
    
                $(this).addClass("btn-primary").removeClass("btn-basic");
                $(this).css('border', '1px solid gray');
              }
            })
    
            let btnLabelWindowToggle = $('#btnLabelWindowShowHide' + V.imageType);
            if (!V.isShowLabelWindow) btnLabelWindowToggle.removeClass("btn-primary").addClass("btn-basic");
    
            btnLabelWindowToggle.on('click', function () {
              if (V.isShowLabelWindow) {
                V.isShowLabelWindow = false;
                $("#labelViewer" + V.imageType).addClass('hide').removeClass('show');
    
                $(this).addClass("btn-basic").removeClass("btn-primary");
                $(this).css('border', '1px solid #dd0');
                //          btnLabelWindowToggle.text('Hide Label Window');
              } else {
                V.isShowLabelWindow = true;
                $("#labelViewer" + V.imageType).addClass('show').removeClass('hide');
    
                $(this).addClass("btn-primary").removeClass("btn-basic");
                $(this).css('border', '1px solid gray');
                //          btnLabelWindowToggle.text('Show Label Window');
              }
            })
    
            //단축키 추가
            document.onkeydown = function(e) {
              //console.log(e)
              if (e.ctrlKey && e.which == 37) { //left arrow
                V.openImagePrevNext('PREV');
              } else if (e.ctrlKey && e.which == 39) {  //right arrow
                V.openImagePrevNext('NEXT');
              }
            }
          },
    
          hideLabelViewer: () => {
            let btnLabelWindowToggle = $('#btnLabelWindowShowHide' + V.imageType);
            V.isShowLabelWindow = false;
            $("#labelViewer" + V.imageType).addClass('hide').removeClass('show');
            //      btnLabelWindowToggle.addClass("btn-basic").removeClass("btn-primary");
            //      btnLabelWindowToggle.css('border', '1px solid gray');
            //      btnLabelWindowToggle.text('Show Label Window');
          },
    
          showLabelViewer: () => {
            let btnLabelWindowToggle = $('#btnLabelWindowShowHide' + V.imageType);
            V.isShowLabelWindow = true;
            $("#labelViewer" + V.imageType).removeClass('hide').addClass('show');
            //      btnLabelWindowToggle.addClass("btn-primary").removeClass("btn-basic");
            //      btnLabelWindowToggle.css('border', '1px solid #dd0');
            //      btnLabelWindowToggle.text('Hide Label Window');
          },
    
          loadSlides: async (pathology_id) => {
            if (pathology_id) {
              if (V.imageType == '_slide') {
                V.slides = await $.getSlides(pathology_id)
              } else if (V.imageType == '_gross') {
                V.slides = await $.getGross(pathology_id)
              } else if (V.imageType == '_exampic') {
                V.slides = await $.getOthers(pathology_id)
              }
            }
    
            if (V.slides.length > 0) {
              V.drawThumbnails();
    
              let slide;
              let requestFile = $("#requestFile").val();
              console.log("###########init requestFile",requestFile)
    
              if (!isEmpty(requestFile)) {
                slide = V.slides.find((e) => {
                  return e.name == requestFile
                })
                $("#requestFile").val("");//초기화
              } else {
                slide = V.slides[0];
              }
    
              V.open(slide)
              //$('#thumbnails' + V.imageType).find('li:first').addClass("selectedLine");
              $('#thumbnails' + V.imageType).find('li[data-filename="' + slide.name + '"]').addClass("selectedLine");
    
    
            }
          },
    
          refreshSlideInfo: async (pathology_id) => {
            console.log("#refreshSlideInfo#", pathology_id)
    
            if (pathology_id) {
              if (V.imageType == '_slide') {
                V.slides = await $.getSlides(pathology_id)
              } else if (V.imageType == '_gross') {
                V.slides = await $.getGross(pathology_id)
              } else if (V.imageType == '_exampic') {
                V.slides = await $.getOthers(pathology_id)
              }
            }
          },
    
          drawThumbnails: () => {
            console.log("#drawThumbnails# start")
    
            $('#thumbnails' + V.imageType + ' .mCSB_container').empty();
            $('#thumbnails' + V.imageType + '_cnt').html(V.slides.length);
    
            //파일명으로 부터 부가정보 처리(블럭,염색명 등)
            V.slides.forEach((e, i) => {
              if (V.imageType == '_slide') {//vslide 이면
                /*
                병리번호^#병리번호, 병리번호^ 패턴 이후에  #슬라이드번호#염색병 또는 슬라이드 키 로 구성됨
                #슬라이드번호#염색병 또는 슬라이드 키 만 사용(앞 패턴 삭제)
    
                정보표시 라인1 슬라이드번호 표시
                정보표시 라인2 염색명, 염색명이 없으면 슬라이드번호 표시
    
                  S 180067542^#S 180067559#2#PAS.svs
                  C 180006920#Muscle Fro#DYS2#$.svs
                  C 180007458^#.svs
                  S 180070622^#S 180070622##MT.svs
    
                  S 190048108^#1#.svs
                  S 190048108^#2#PAS.svs
                  S 190048108^#4#.svs
                  S 190048108^#5#PAS.svs
                  S 190048108^#7#.svs
                  S 190048108^#8#PAS.svs
                  S 190048108^#kidney#CD3.svs
                  S 190048108^#kidney#SV40.svs
                  S 190048108^#S 190048108#3#MT.svs
                  S 190048108^#S 190048108#6#Jones.svs
    
                  병리번호#모번호#블럭명#오더명(그외)#검체번호(Frozen 케이스만 해당)
                  병리번호#블럭명#염색명#출력구분(C : 카세트, S : 슬라이드)#순번(HIS 출력 키 값)
                  S 190011101^#10##S#34.svs  => PTHL_NO(병리번호)^#TH1_SLID_CNTE(슬라이드번호)#TH2_SLID_CNTE(슬라이드번호2)#타입#SEQ(슬라이드키)
                */
    
                var filename, extra_info, extra_info1, extra_info2
                filename = e.name.substring(0, e.name.lastIndexOf("."));//화일확장자제거
    
                var str = filename;
    
                // console.log("파일명:" + str);
    
                //S 190048108^#S 190048108
                str = str.replace(/([a-z]{1}[a-z\s]{1}\d{9}\^{0,1})(#[a-z]{1}[a-z\s]{1}\d{9}){0,1}/gi, "");    //병리번호 패턴 제거
    
                // console.log("병리번호패턴제거파일명:" + str);
    
                var sharpCnt = (str.match(/#/g) || []).length;
                extra_info = str.split("#");
    
                // console.log("sharpCnt=" + sharpCnt);
                // console.log(extra_info);
    
                e.extra_info1='';
                e.extra_info2='';
    
                if (str.match(/#\w+/g)) {
                  switch (sharpCnt) {
                    case 0:
                      // console.log("case:0");
                      e.extra_info1 = filename;
                      e.extra_info2 = "";
                    case 1: //#슬라이드번호
                      // console.log("case:1");
                      e.extra_info1 = extra_info[1].trim(); //슬라이드번호 자리
                      e.extra_info2 = '';
                      break;
                    case 4: //S 190044496^#4#2#F#4.svs 병리번호#블럭명#염색명#출력구분(C : 카세트, S : 슬라이드)#순번(HIS 출력 키 값)
                      if (extra_info[3].trim()=='F')  { //출력구분 F Frozen
                        e.extra_info1 = 'FR ' + extra_info[1].trim();
                        e.extra_info2 = ''  //extra_info[2].trim();
                      } else {
                        e.extra_info1 = extra_info[1].trim();
                        e.extra_info2 = extra_info[2].trim();
                      }
                      break;
                    default:
                      // console.log("case:2");
                      e.extra_info1 = extra_info[1].trim();
                      e.extra_info2 = extra_info[2].trim();
                      break;
                  }
                } else {
                  e.extra_info1 = filename;
                  e.extra_info2 = "";
                }
              } else if (V.imageType == '_exampic') {
                if (e.extraInfo == '' || e.extraInfo == null) {
                  e.extra_info1 = String(i + 1)
                  e.extra_info2 = "";
                } else {
                  e.extra_info1 = String(i + 1);
                  e.extra_info2 = e.extraInfo;
                }
              } else {
                e.extra_info1 = String(i + 1);
                e.extra_info2 = "";
              }
            })
    
            // 슬라이드일경우 배열 정렬
            if (V.imageType == '_slide') {
              V.slides.sort(function(obj1,obj2){
                var a = obj1.extra_info1;
                var b = obj2.extra_info1;
    
                var reA = /[^a-zA-Z]/g;
                var reN = /[^0-9]/g;
                var aA = a.replace(reA, "");
                var bA = b.replace(reA, "");
                if (aA === bA) {
                  var aN = parseInt(a.replace(reN, ""), 10);
                  var bN = parseInt(b.replace(reN, ""), 10);
                  return aN === bN ? 0 : aN > bN ? 1 : -1;
                } else {
                  return aA > bA ? 1 : -1;
                }
              })
            }
            console.log("##########################################")
            V.slides.forEach((e, i) => {
              var img = $('<img class="center" title="' + e.name + '">');
              var img_url = V.serveEndPoint + e.thumbnail;
              img.attr('src', img_url.replace(/#/gi, '%23').replace(/\(/gi, '%28').replace(/\)/gi, '%29').replace(/\s/gi, '%20'))
              //console.log("drawThumbnails imr.src=" + img_url)
    
              var filename, extra_info, extra_info1, extra_info2
              filename = e.name.substring(0, e.name.lastIndexOf("."));//화일확장자제거
              extra_info  = e.extra_info
              extra_info1 = e.extra_info1
              extra_info2 = e.extra_info2
    
              //말줄임 박스 문제 해결필요
              var imageInfoId = V.imageType + '_' + i;
              //        imageInfo.attr('class', 'viewr-th-tex')
    
              //프로젝트 라이브러리 권한이 있을시(1) 체크박스 추가
              if ($("#project_auth").val() == '1' && V.imageType == '_slide') {
                var imageInfo = $('<span class="viewr-th-tex line1" title="' + extra_info1 + '"><input type="checkbox" name="Thumbnail_chkbox" value="' + e.name + '"><label>' + extra_info1 + '</label></span><span class="viewr-th-tex line2" id="' + imageInfoId + '" title="' + extra_info2 + '"><label>' + extra_info2 + '</label></span>');
              } else {
                var imageInfo = $('<span class="viewr-th-tex line1" title="' + extra_info1 + '"><label>' + extra_info1 + '</label></span><span class="viewr-th-tex line2" id="' + imageInfoId + '" title="' + extra_info2 + '"><label>' + extra_info2 + '</label></span>');
              }
    
              var li = $('<li/>', {'data-filename': e.name, 'data-pathology_id': e.pathologyNumber, 'data-path': e.path})
              li.attr('class', 'viewr-th-img');
              li.css('cursor', 'pointer');
    
              img.appendTo(li)
              imageInfo.appendTo(li)
              li.appendTo('#thumbnails' + V.imageType + ' .mCSB_container')
              $('#thumbnails' + V.imageType + ' .mCSB_container').css("height","100%");//스크롤바 영역이 텍스트 가리는 문제ㅉ 임시처리
    
              //버추얼슬라이드 썸네일 li-img 클릭시 슬라이드 오픈
              li.on('click', 'img', function () {
                var li = $(this).parent("li")
                var name = li.data('filename')
                var slide = V.slides.find((e) => {
                  return e.name == name
                })
    
                li.addClass("selectedLine");
                li.siblings().removeClass("selectedLine");
    
                V.open(slide)
              })
    
              //버추얼슬라이드 썸네일 li-span-lable 클릭시 슬라이드 오픈
              li.on('click', 'label', function () {
                var li = $(this).parent("span").parent("li")
                var name = li.data('filename')
                var slide = V.slides.find((e) => {
                  return e.name == name
                })
    
                li.addClass("selectedLine");
                li.siblings().removeClass("selectedLine");
    
                V.open(slide)
              })
              console.log(filename,extra_info1,extra_info2);
    
              //부가정보 call 필요(슬라이드만)
              if (extra_info2 == '') {
                if (V.imageType == '_slide') {
                  $.getSlideExtraInfo(V.pathology_id, extra_info1.replace(/\s/gi, ""), function (data) {
                    //SLID_PRO_MTHD_CNTE 값을 가져옴
                    if (data == '' || data == null || data == 'undefiend') {
                      extra_info2 = '';
                    } else {
                      var tmp = data.split(':');
                      console.log("getSlideExtraInfo result : ", tmp);
                      if (tmp.length > 1) {
                        extra_info2 = tmp[1];
                      } else {
                        extra_info2 = data;
                      }
                    }
                    $('#' + imageInfoId).html(extra_info2).attr("title", extra_info2);
                  })
                }
              }
            })
            console.log("##########################################")
    
            $('#thumbnails' + V.imageType).mCustomScrollbar("update");
            console.log("drawThumbnails complete")
    
            //IE일 경우 썸네일 Fit 처리
            var userAgent, ieReg, ie;
            userAgent = window.navigator.userAgent;
            ieReg = /msie|Trident.*rv[ :]*11\./gi;
            ie = ieReg.test(userAgent);
            //      console.log(ie);
            if (ie) {
              console.log("IE");
              $(".viewr-th-img").each(function () {
                var $container = $(this),
                  imgUrl = $container.find("img").prop("src");
                console.log("imgUrl");
                if (imgUrl) {
                  $container.css("backgroundImage", 'url(' + imgUrl + ')').addClass("custom-object-fit");
                }
              });
            }
            console.log("drawThumbnails image Fit - Covered")
            console.log("#drawThumbnails# end")
          },
    
          openImagePrevNext:(mode) => {
            var currentIndex = V.currentImageIdx;
            var lastIndex = V.slides.length-1;
            var moveIndex = 0;
    
            if (currentIndex==-1) return;
    
            if (mode=='NEXT') {
              if (lastIndex==currentIndex) {
                moveIndex = lastIndex;
              } else {
                moveIndex = currentIndex+1;
              }
            } else if (mode=='PREV') {
              if (currentIndex==0) {
                moveIndex = currentIndex;
              } else {
                moveIndex = currentIndex-1;
              }
            }
            var slide = V.slides[moveIndex];
            V.open(slide);
            $('#thumbnails' + V.imageType).find('li[data-filename="' + slide.name + '"]').addClass("selectedLine").siblings().removeClass("selectedLine");
          },
    
          open: async (slide) => {
    
            console.log("open: async (slide)")
            // console.log("--image info");
            // console.log(slide);
    
            $('#annotations' + V.imageType + '>li').remove();
    
            V.annotations = await $.loadAnnotations(V.pathology_id, V.imageType)
    
            /*
              V.slides에서 블럭번호와 검사명을 annotations에 추가
            */
            V.annotations.forEach((anno,i) => {
    
              var tmpSlide = V.slides.find((e) => {
                return e.name == anno.filename
              })
    
              if (tmpSlide) {
                  anno.extra_info1 = tmpSlide.extra_info1;
                  anno.extra_info2 = tmpSlide.extra_info2;
              } else {  //어노테이션한 파일이 없는 경우
                  anno.extra_info1="ERR"
                  anno.extra_info2=""
              }
            })
    
            console.log(V.annotations)
    
            V.openslide(slide);
    
            V.counter = 1;
            $("#numberCounter").val(V.counter);
    
            V.isShowAnnotation = true;
    
            //set foucs for Keyboard Navigaton
            document.getElementById('view'+V.imageType).querySelector('.openseadragon-canvas').focus();
    
          },
    
          //annotation list creation
          createAnnotationLink: (e) => {
            let annotationIcon = {
              'LINEDRAW': 'i_line.png',
              'FREEDRAW': 'i_path.png',
              'RULER': 'i_ruler.png',
              'NUMBERING': 'i_number.png',
              'RECTDRAW': 'i_square.png',
              'ELLIPSEDRAW': 'i_ellipse.png',
              'svs' : 'i_path.png'  //aperio 임의설정
            };
            // console.log("##########");
            // console.log(e.annotationType);
    
            let li = $('<li/>', {
              'data-anno': e.id,
              'data-pathology_id': e.pathology_id,
              'data-filename': e.filename,
              'class': 'anno-list'
            })
    
            let extra_info1 = (''||e.extra_info1);
            let lengthText = (e.length || '') + (e.lengthUnit || '')
            let annoTitle = lengthText ? e.title + ' - ' + lengthText : e.title;
    
    
            let blockInfo = $('<span class="anno-list-block">' + extra_info1 + '</span>')
            blockInfo.appendTo(li);
    
            // let icon = $('<span><img class="anno-type" src="/img/' + annotationIcon[e.annotationType] + '" width="24" height="24" alt="'+e.annotationType+'"/></span>');
            let icon = $('<span class="anno-list-shape"><img src="/img/' + annotationIcon[e.annotationType] + '" width="24" height="24" /></span>');
            icon.appendTo(li);
    
            let titleInfo = $('<span class="anno-list-title" data-toggle="popover" data-content="병리번호:' + e.pathology_id + "<br>파일명:" + e.filename + "<br>작성자:" + e.userName + "<br>작성일:" + e.modifiedDate + '" data-title="' + e.title + '">' + annoTitle + '</span>');
            titleInfo.appendTo(li);
    
            let btnDelete = $('<span class="anno-list-action label label-warning float-right" title="delete annotation"><i class="fas fa-trash-alt"></i></span>');
            btnDelete.click((e) => {
              // e.preventDefault();
              //e.stopPropagation();
              /* 삭제시 매번 삭제 확인을 해야하는 불편이 있다고 제거
              setTimeout(function(){
                if (confirm('Are you sure to delete this item?')) {
                  let annotationid = $(e.currentTarget).parent().data('anno');
                  V.deleteAnnotation(annotationid);
                }
              }, 1000);
              */
              let annotationid = $(e.currentTarget).parent().data('anno');
              V.deleteAnnotation(annotationid);
            })
    
            let btnEdit = $('<span class="anno-list-action label label-info float-right" title="edit annotation information"><i class="fas fa-edit"></i></span>');
            btnEdit.click((e) => {
              let annotationid = $(e.currentTarget).parent().data('anno');
    
              // e.preventDefault();
              // e.stopPropagation()
    
              if (V.annotation.id==annotationid){
                $("#divAnnotationSetting").toggle();
              } else {
                $("#divAnnotationSetting").show();
              }
    
              // e.preventDefault();
              // e.stopPropagation();
    
              var annotation = V.annotations.find(anno => anno.id == annotationid)
              V.annotation = annotation;
              console.log(annotation);
              console.log(annotation.annotation);
              $("#frmAnnotationSetting input[name=annotation_id]").val(annotation.id);
              $("#frmAnnotationSetting input[name=pathology_id]").val(annotation.pathology_id);
              $("#frmAnnotationSetting input[name=extra_info1]").val(annotation.extra_info1);
              $("#frmAnnotationSetting input[name=extra_info2]").val(annotation.extra_info2);
              $("#frmAnnotationSetting input[name=filename]").val(annotation.filename);
              $("#frmAnnotationSetting input[name=imageType]").val(annotation.imageType);
              $("#frmAnnotationSetting input[name=annotationType]").val(annotation.annotationType);
              $("#frmAnnotationSetting input[name=length]").val(annotation.length);
              $("#frmAnnotationSetting input[name=lengthUnit]").val(annotation.lengthUnit);
              $("#frmAnnotationSetting input[name=coordinates]").val(JSON.stringify(annotation.annotation).end);
              $("#frmAnnotationSetting input[name=user_id]").val(annotation.user_id);
              $("#frmAnnotationSetting input[name=title]").val(annotation.title);
    
            })
    
            if ($("#dept").val() == 'P') {// 병리과만 삭제
              btnDelete.appendTo(li);
              btnEdit.appendTo(li);   //TODO 수정기능 구현중
            }
    
            li.appendTo('#annotations' + V.imageType);
    
            li.on('click', function (e) {
              // if ($(this).find(".anno-title").attr('contentEditable')) {
              //     return;
              // }
                $('[data-toggle="popover"]').popover("hide")
    
              let id = $(this).data('anno');
              let pathology_id = $(this).data('pathology_id');
              let filename = $(this).data('filename');
    
              console.log("id=" + id)
              console.log("pathology_id=" + pathology_id)
              console.log("filename=" + filename)
              console.log("V.slide.name=" + V.slide.name);
    
              if (V.slide.name != filename) {//어노테이션에 해당하는 이미지로 변경
                let slide = V.slides.find((e) => {
                  return e.name == filename
                })
                
                if (slide) {
                  V.open(slide)
                } else {
                  alert("the file does not exist for this annoation");
                  return false;
                } 
    
                $('#thumbnails' + V.imageType).find('li[data-filename="' + filename + '"]').addClass("selectedLine").siblings().removeClass("selectedLine");
                $('#annotations' + V.imageType).find('li[data-anno="' + id + '"]').addClass("selected").siblings().removeClass("selected");
              }
    
              let rect = V.annotations.find((el) => {
                return el.id === id
              })
    
              // 선택 하이라이트
              $("li.anno-list.selected").removeClass("selected");
              $(this).addClass('selected');
    
              let clickedShape = JSON.parse(rect.annotation);
    
              $('svg').children('.path-selected').removeClass('path-selected')
              $('#'+id).addClass('path-selected');
    
              if (typeof clickedShape.end === 'undefined') {// 기존 rect 어노테이션 표시
    
                let overlay = V.viewer.viewport.imageToViewportRectangle(clickedShape.x, clickedShape.y, clickedShape.width, clickedShape.height)
                V.viewer.viewport.fitBounds(overlay)
                setTimeout(function () {
                  V.viewer.viewport.zoomBy(0.5).applyConstraints();
                }, 400)
    
              } else {
                const size = V.viewer.viewport._contentSize;
    
                if (clickedShape.end[0] === 'line') {
                  console.log('svg : line');
    
                  const w = Math.abs(clickedShape.end[1].x1 - clickedShape.end[1].x2) / 100 * size.x
                  const h = Math.abs(clickedShape.end[1].y1 - clickedShape.end[1].y2) / 100 * size.y
    
                  const lineCenterPoint = {
                    x: clickedShape.end[1].x1 >= clickedShape.end[1].x2 ? clickedShape.end[1].x2 / 100 * size.x : clickedShape.end[1].x1 / 100 * size.x,
                    y: clickedShape.end[1].y1 >= clickedShape.end[1].y2 ? clickedShape.end[1].y2 / 100 * size.y : clickedShape.end[1].y1 / 100 * size.y,
                  };
    
                  let overlay = V.viewer.viewport.imageToViewportRectangle(lineCenterPoint.x, lineCenterPoint.y, w, h);
    
                  V.viewer.viewport.fitBounds(overlay)
                  setTimeout(function () {
                    V.viewer.viewport.zoomBy(0.5).applyConstraints();
                  }, 400)
                } else if (clickedShape.end[0] === 'path') {
                  console.log('svg : path');
    
                  const pathResult = V.getPathCenter(clickedShape.end[1].d);
    
                  const pathScaledResult = {
                    x: (pathResult.min.x + ((pathResult.max.x - pathResult.min.x) / 2)) / 100 * size.x,
                    y: (pathResult.min.y + ((pathResult.max.y - pathResult.min.y) / 2)) / 100 * size.y,
                    w: (pathResult.max.x - pathResult.min.x) / 100 * size.x,
                    h: (pathResult.max.y - pathResult.min.y) / 100 * size.y
                  }
    
                  let overlay = V.viewer.viewport.imageToViewportRectangle(pathScaledResult.x, pathScaledResult.y, pathScaledResult.w, pathScaledResult.h);
    
                  V.viewer.viewport.fitBounds(overlay)
    
                  setTimeout(function () {
                    V.viewer.viewport.zoomBy(0.5).applyConstraints();
                  }, 400)
                } else if (clickedShape.end[0] === 'rect') {
                  const rectCenterPoint = {
                    x: clickedShape.end[1].x / 100 * size.x,
                    y: clickedShape.end[1].y / 100 * size.y,
                    w: clickedShape.end[1].width / 100 * size.x,
                    h: clickedShape.end[1].height / 100 * size.y
                  };
    
                  console.log("rectCenterPoint")
                  console.log(rectCenterPoint)
    
                  let overlay = V.viewer.viewport.imageToViewportRectangle(rectCenterPoint.x, rectCenterPoint.y, rectCenterPoint.w, rectCenterPoint.h);
    
                  V.viewer.viewport.fitBounds(overlay)
                  setTimeout(function () {
                    V.viewer.viewport.zoomBy(0.5).applyConstraints();
                  }, 400)
                } else {
    
                  console.log('Unknown svg type')
                  console.log(rect)
                }
              }
            })
    
          },
    
          deleteAnnotation: async (id) => {
            console.log("#deleteAnnotation: async (id)")
    
            $('#annotations' + V.imageType + '>li[data-anno=' + id + ']').remove();
            //$('li[anno-data=' + id + ']').remove();
    
            // while ($("div[id=" + id + "]").length != 0) {
              // $("div[id=" + id + "]").remove()
            // }
    
            //zoom update 시 다시생성되어 임시로 히든처리함.
            $("div[id=" + id + "] > span").addClass('hide').removeClass('show');
            $("div[id=" + id + "]").remove() //
    
            // while ($("path[id=" + id + "]").length != 0) {
              $("path[id=" + id + "]").remove()
            // }
    
            // while ($("line[id=" + id + "]").length != 0) {
              $("line[id=" + id + "]").remove()
            // }
    
            // while ($("rect[id=" + id + "]").length != 0) {
              $("rect[id=" + id + "]").remove()
            // }
            $("ellipse[id=" + id + "]").remove()
    
    
    
            // if (isPath || isLine) {
              console.log('need remove data in V.annotationPlugin.annotations array');
              console.log(V.annotationPlugin.model.annotations.length);
              V.annotationPlugin.model.removeAnnotationById(id)
              console.log(V.annotationPlugin.model.annotations.length);
            // }
    
            await $.deleteAnnotation(id)
    
            // V.annotations = await $.loadAnnotations(V.pathology_id, V.imageType)
    
            // V.viewer.clearOverlays()
            // V.showAnnotations()
          },
    
          getPathCenter: (dStr) => {
            console.log("getPathCenter: (dStr)")
            const path = dStr;
            const lines = dStr.split('L');
            let result = [];
    
            let tmpLine;
    
            lines.forEach(function (line) {
              tmpLine = line.trim();
    
              if (tmpLine.indexOf('M') === 0) {
                tmpLine = tmpLine.split('M')[1];
              }
    
              let pos = tmpLine.split(' ');
    
              result.push({
                x: pos[0],
                y: pos[1]
              });
            });
    
            let sumX = 0;
            let sumY = 0;
            let start = true;
            let minX, minY;
            let maxX, maxY;
            let tmpX, tmpY;
    
            result.forEach((pos) => {
              tmpX = parseFloat(pos.x);
              tmpY = parseFloat(pos.y);
    
              if (start) {
                start = false;
                minX = maxX = tmpX;
                minY = maxY = tmpY
              }
              sumX += tmpX;
              sumY += tmpY;
    
              if (tmpX < minX) {
                minX = tmpX;
              }
              if (tmpY < minY) {
                minY = tmpY;
              }
              if (tmpX > maxX) {
                maxX = tmpX;
              }
              if (tmpY > maxY) {
                maxY = tmpY;
              }
            });
    
            let resultObj = {
              x: sumX / result.length,
              y: sumY / result.length,
              min: {
                x: minX,
                y: minY
              },
              max: {
                x: maxX,
                y: maxY
              }
            };
    
    
            return resultObj;
          },
    
          getPathBound: (dStr) => {
            // console.log("getPathBound: (dStr) ")
            const path = dStr;
            const lines = dStr.split('L');
            let result = [];
    
            let tmpLine;
    
            lines.forEach(function (line) {
              tmpLine = line.trim();
    
              if (tmpLine.indexOf('M') === 0) {
                tmpLine = tmpLine.split('M')[1];
              }
    
              let pos = tmpLine.split(' ');
    
              result.push({
                x: pos[0],
                y: pos[1]
              });
            });
    
            let sumX = 0;
            let sumY = 0;
            let start = true;
            let minX, minY;
            let maxX, maxY;
            let tmpX, tmpY;
    
            result.forEach((pos) => {
              tmpX = parseFloat(pos.x);
              tmpY = parseFloat(pos.y);
    
              if (start) {
                start = false;
                minX = maxX = tmpX;
                minY = maxY = tmpY
              }
              sumX += tmpX;
              sumY += tmpY;
    
              if (tmpX < minX) {
                minX = tmpX;
              }
              if (tmpY < minY) {
                minY = tmpY;
              }
              if (tmpX > maxX) {
                maxX = tmpX;
              }
              if (tmpY > maxY) {
                maxY = tmpY;
              }
            });
    
            let resultObj = {
              x: minX,
              y: minY,
              width: (maxX - minX),
              height: (maxY - minY)
            };
    
            return resultObj;
          },
    
          // selection libray 제거
          // onSelection: async (rect) => {
          //   console.log("##onSelection: async (rect)")
          //   var annotation = {}
          //   annotation.x = rect.x
          //   annotation.y = rect.y
          //   annotation.width = rect.width
          //   annotation.height = rect.height
    
          //   var obj = {}
          //   obj.pathology_id = V.slide.pathologyNumber //해당 슬라이드의 병리번호 세팅
          //   obj.imageType = V.imageType
          //   obj.filename = V.slideName
          //   obj.title = ''
          //   obj.annotation = JSON.stringify(annotation)
    
          //   var title = prompt('title', '')
          //   if (title === null) {
          //     //to do
          //   } else {
          //     V.annotationPlugin.setModeToMove();
    
          //     obj.title = title;
    
          //     var _annotation = await jQuery.saveAnnotation(obj)
          //     V.annotations.push(_annotation)
          //     let ele = V.createElement(_annotation)
          //     V._drawRectAnnotation(ele, _annotation)
          //     V.createAnnotationLink(_annotation)
          //   }
          // },
          // selection libray 제거
    
          //annotaion label create
          createAnnoLabel: (rect, type) => {
            //console.log("#createAnnoLabel: (rect, type)" + "/" + type);
            // console.log(rect);
    
            var div = document.createElement('div')
            var span = document.createElement('span');
            var spanLength = document.createElement('span');
    
            div.setAttribute('id', rect.id)
            $(div).addClass('show');
            $(div).addClass('rect-anno');
            div.setAttribute('title', rect.title)
    
            if (type === 'rect') {
              div.style.outline = '2px solid #696969'
              div.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
    
              div.addEventListener("mouseover", function (e) {
                if ($(e.target).hasClass('rect-anno')) {
                  e.target.style.backgroundColor = 'transparent'
                }
              }, false);
              div.addEventListener("mouseout", function (e) {
                if ($(e.target).hasClass('rect-anno')) {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                }
              }, false);
            }
    
            // span.textContent = "["+rect.id+"] "+ rect.title;
            span.textContent = rect.title;
            spanLength.textContent = rect.length + rect.lengthUnit;
    
            $(span).addClass('anno-label')
            $(spanLength).addClass('anno-label')
    
            if (V.isShowAnnoLabel == true) {
              $(span).addClass('show');
              $(span).removeClass('hide');
              $(spanLength).addClass('show');
              $(spanLength).removeClass('hide');
            } else {
              $(span).addClass('hide');
              $(span).removeClass('show');
              $(spanLength).addClass('hide');
              $(spanLength).removeClass('show');
            }
    
            div.appendChild(span);
            div.appendChild(spanLength);
    
            /*
              * div.addEventListener('contextmenu', function (e) {
              * e.preventDefault(); if (confirm('Are you sure to delete this
              * item?')) { var t = e.target var id = t.getAttribute('id')
              * V.deleteAnnotation(id) } }, false)
              */
            return div
          },
    
          drawAnnotations: (annotations, type) => {
            console.log("#drawAnnotations: (annotations, type)" + annotations.length + " - " + type)
            console.log(annotations);
    
            annotations.forEach(async (e) => {
              const ele = await V.createAnnoLabel(e, type)
              if (type === 'rect') {
                const id = await V._drawRectAnnotation(ele, e)
              } else {
                const id = await V._drawBound(ele, e)
              }
            })
          },
    
          editAnnoLabel: () => {
    
          },
    
          openslide: (slide) => {
            console.log("openslide: (slide)")
            console.log(slide)
            // let u = '/slide/'+slide.pathologyNumber + '/' + slide.name +
            // '/slide.dzi'
            V.initViewer();
    
            let u = V.serveEndPoint + slide.path + "/slide.dzi";
            let tilesourceUrl = u.replace(/#/gi, '%23').replace(/\(/gi, '%28').replace(/\)/gi, '%29').replace(/\s/gi, '%20');
    
            V.viewer.open(tilesourceUrl);
            V.slideName = slide.name;
            V.slide = slide;
            V.currentImageIdx = V.slides.findIndex(function(e){
                return e.name == slide.name;
            });
    
            $("#slideInfo").hide();
            $("#slide_pathology_id").html(V.slide.pathologyNumber + " : " + V.slideName);
            $("#slideInfo").stop().show().delay(2000).fadeOut("slow");
    
            if (V.imageType == '_slide') {
            } else if (V.imageType == '_gross' || V.imageType == '_exampic') {
              console.log("openslide : slide.pixelsPerCentimeter = " + slide.pixelsPerCentimeter);
              console.log("openslide : slide.lengthUnit = " + slide.lengthUnit);
    
              V.slideMpp = slide.pixelsPerCentimeter;
              V.lengthUnit = slide.lengthUnit;
            }
          },
    
          init: (id, imageType) => {
            console.log('init: (id, imageType)' + id + ',' + imageType)
            console.log(V)
            V.pathology_id = $('#pathology_id').val()
            V.id = id;
            V.imageType = imageType;
            V.loadSlides(V.pathology_id);
          },
    
          initViewer: () => {
            console.log("initViewer: () ");
    
            if (V.viewer !== null) {
              V.viewer.destroy();
              V.viewer = null;
              console.log('viewer.destroy()' + V.imageType)
            }
            if (V.viewer == null) {
              OpenSeadragon.setString('LineDraw', 'draw line');
              OpenSeadragon.setString('FreeDraw', 'draw path');
              OpenSeadragon.setString('Ruler', 'measure length');
    
              V.viewer = OpenSeadragon({
                id: V.id,
                prefixUrl: "/images/",
                timeout: 120000,
                animationTime: 0.5,
                blendTime: 0.1,
                constrainDuringPan: true,
                maxZoomPixelRatio: 2,
                minZoomLevel: 0,
                visibilityRatio: 1,
                zoomPerScroll: 2,
                showNavigator: true,
                navigatorPosition: "BOTTOM_RIGHT",
                // Initial rotation angle
                degrees: 0,
                // Show rotation buttons
                showRotationControl: true,
                gestureSettingsMouse: {
                  pinchRotate: true
                }
                //gestureSettingsTouch: {pinchRotate: true}
                // sequenceMode: true
              });
    
              if (V.labelViewer == null) {
                V.labelViewer = new OpenSeadragon({
                  id: "labelViewer" + V.imageType,
                  prefixUrl: "/images/",
                  timeout: 120000,
                  animationTime: 0.5,
                  blendTime: 0.1,
                  constrainDuringPan: true,
                  maxZoomPixelRatio: 2,
                  minZoomLevel: 0,
                  visibilityRatio: 1,
                  zoomPerScroll: 2,
                })
                $(V.labelViewer.navControl).remove();
              }
    
              window.V = V;
    
              // add open handler
              V.viewer.addHandler("open", function (a) {
                console.log("V.viewer.addHandler('open')")
                V.viewer.source.minLevel = 1;
    
                console.log("V.viewer.source.dimensions")
                console.log(V.viewer.source.dimensions)
        
                const lastIndexOfDZI = a.source.lastIndexOf('slide.dzi');
                if (lastIndexOfDZI > -1) {
                  const slideMppUrl = a.source.substring(0, lastIndexOfDZI);
                  //            console.log("slideMppUrl="+slideMppUrl);
                  let r = $.getSlideInfo(slideMppUrl, function (data) {
                    console.log("getSlideInfo data=");
                    //              console.log(data);
    
                    if (V.imageType != '_slide' || data.associated_urls == null || data.associated_urls.label === 'undefined') {
                      V.hideLabelViewer();
                      V.labelViewer.open('');
                    } else {
                      if (V.isShowLabelWindow) {
                        V.labelViewer.open(V.serveEndPoint + data.associated_urls.label);
                        V.showLabelViewer();
                      }
                    }
    
                    console.log("V.slideMpp=" + V.slideMpp);
                    console.log("data.slide_mpp=" + data.slide_mpp);
    
                    let _pixelsPerMeter = 0;
    
                    if (V.imageType == '_slide') {
                      //VS data.slide_mpp : Microns per pixel => pixelsPerMeter
                      _pixelsPerMeter = 1 / data.slide_mpp * 1000000;
                      V.slideMpp = data.slide_mpp; //Microns per pixel
                      V.slideMagnification = data.slide_magnification;
                    } else if (V.imageType == '_gross' || V.imageType == '_exampic') {
                      if (!isEmpty(V.slideMpp)) {
                        //gross slide_mpp : pixels per centimeter// => pixelsPerMeter
                        _pixelsPerMeter = V.slideMpp * 100;
                        V.slideMpp = 1 / V.slideMpp * 10000; //pixels per centimeter => Microns per pixel
                      }
                    }
    
                    V.viewer.scalebar({
                      type: OpenSeadragon.ScalebarType.MAP,
                      pixelsPerMeter: _pixelsPerMeter,
                      minWidth: "75px",
                      location: OpenSeadragon.ScalebarLocation.BOTTOM_LEFT,
                      xOffset: 80,
                      yOffset: 10,
                      stayInsideImage: true,
                      color: "rgb(150, 150, 150)",
                      fontColor: "rgb(100, 100, 100)",
                      backgroundColor: "rgba(255, 255, 255, 0.7)",
                      fontSize: "small",
                      barThickness: 2,
                      magnification: V.slideMagnification
                    });
    
                    //scalebar refresh
                    V.viewer.scalebarInstance.refresh();
    
                  });
                }
    
                // add annotation plugin
                console.log("V.annotationPlugin = new OpenSeadragon.Annotations()")
    
                V.annotationPlugin = new OpenSeadragon.Annotations({
                  viewer: V.viewer,
                  savefunc: async function (model, anno) {
                    console.log("##savefunc: async function(model, anno)")
                    let title = null;
                    let length = null;
                    let lengthUnit = null;
    
                    //유형별 타이틀 처리
                    if (model.mode === "RULER") {
                      const linelength = V.annotationPlugin.getLength(anno);
                      // VS/그로스 처리 별도로 해야함....
                      if (V.imageType == '_slide') {
    //                    alert("길이 : " + (linelength * V.slideMpp).toFixed(2) + " μm.");
    //                    title = (linelength * V.slideMpp).toFixed(2) + " μm.";
                          V.lengthUnit = "mm";
                      } else if (V.imageType == '_gross' || V.imageType == '_exampic') {
                        if (isEmpty(V.slideMpp)) {
                          showModalRulerSetting();
                          return;
                        }
                      }
                      var convertUnit = 0;
                      switch (V.lengthUnit) {
                        case "μm":
                          convertUnit = 1;
                          break;
                        case "mm":
                          convertUnit = 1000;
                          break;
                        case "cm":
                          convertUnit = 10000;
                          break;
                        default:
                          convertUnit = 0;
                          break;
                      }
    
                      length = (linelength * V.slideMpp / convertUnit).toFixed(2);
                      lengthUnit = V.lengthUnit;
                      title = prompt("라인 길이:" + length + lengthUnit );
    
                    } else if (model.mode === "NUMBERING") {
                      V.counter = $('#numberCounter').val()
                      title = $('#numberPrefix').val() + (V.counter++).toString();
                      $("#numberCounter").val(V.counter);
                    } else {
                      title = prompt('title');
                    }
    
                    if (title === null) { //타이틀 입력시 취소한 경우 null
                      model.annotations.splice(-2, 2);
                    } else { //타이틀 입력 또는 공백으로 넣은 경우
    
                      let _annotationType = model.mode;
    
                      if (model.mode !== "NUMBERING") {
                        V.annotationPlugin.setModeToMove();
                      }
    
                      let start = model.annotations[model.annotations.length - 2];
                      let end = model.annotations[model.annotations.length - 1];
    
                      anno[2] = title;
    
                      let annoForSave = {
                        id: -1,
                        pathology_id: V.slide.pathologyNumber, //해당 슬라이드의 병리번호 세팅
                        imageType: V.imageType,
                        filename: V.slideName,
                        annotationType: _annotationType,
                        title: title,
                        length: length,
                        lengthUnit: lengthUnit,
                        annotation: JSON.stringify({
                          start: model.annotations[model.annotations.length - 2],
                          end: model.annotations[model.annotations.length - 1],
                        })
                      };
    
                      let _annotation = null
    
                      if ($("#dept").val() == 'P') {// 병리과만 저장
                        _annotation = await $.saveAnnotation(annoForSave)
                        //set annotaion id to deleting
                        model.annotations[model.annotations.length-1][1].id = _annotation.id
                        model.annotations[model.annotations.length-2][1].id = _annotation.id
                      } else {
                        _annotation = annoForSave;
                      }
    
                      _annotation.extra_info1 = V.slide.extra_info1;
                      _annotation.extra_info2 = V.slide.extra_info2;
    
                      V.annotations.push(_annotation);
                      let loadAnno = JSON.parse(_annotation.annotation);
                      let tmpAnnoData;
                      tmpAnnoData = V.toRectData(_annotation, loadAnno);
                      V.drawAnnotations([tmpAnnoData], 'linepath');
                      V.createAnnotationLink(_annotation);
                    }
                  },
                  loadfunc: function (model) {
                    console.log("loadfunc: function(model)")
                    console.log(model.annotations)
                    console.log(V.annotations)
    
                    //Parsing Aperio Xml
                    if ($("#project_auth").val() == '1' && V.imageType == '_slide') {
                      V.isShowAnnoLabel = false;
                      var selectGap = $("#gap").val();
                      var xml_url = '/annotation/aperio/' + V.pathology_id + '/' + V.slideName.substr(0, V.slideName.lastIndexOf('.')) + '.xml';
                      console.time('getAperioXMLTime');
                      var aperioxml_annotation = getAperioXML(xml_url.replace(/#/gi, '%23').replace(/\(/gi, '%28').replace(/\)/gi, '%29').replace(/\s/gi, '%20'));
                      console.timeEnd('getAperioXMLTime');
    
                      console.log("aperioxml_annotation");
                      console.time('aperioToSVGTime');
                      let retAnno = aperioToSVG(aperioxml_annotation);
                      console.timeEnd('aperioToSVGTime');
                      console.log("aperio region count :", retAnno.length);
    
                      console.time('V.annotations.pushTime');
                      retAnno.forEach((anno) => {
                        let annoForSvs = {
                          id: anno[1].id,
                          pathology_id: V.slide.pathologyNumber, //해당 슬라이드의 병리번호 세팅
                          imageType: V.imageType,
                          filename: V.slideName,
                          annotationType: "svs",
                          title: anno[1].id,
                          extra_info1 : '',
                          extra_info2 : '',
                          annotation: JSON.stringify({
    //                        start: anno,
                            end: anno
                          })
                        };
                        V.annotations.push(annoForSvs);
                      })
                      console.timeEnd('V.annotations.pushTime');
                    }
    
                    console.time('V.annotations.drawAnnotations');
                    //어노테이션 정렬
                    V.annotations.sort(function(obj1,obj2){
                      var a = obj1.extra_info1;
                      var b = obj2.extra_info1;
    
                      var reA = /[^a-zA-Z]/g;
                      var reN = /[^0-9]/g;
                      var aA = a.replace(reA, "");
                      var bA = b.replace(reA, "");
                      if (aA === bA) {
                        var aN = parseInt(a.replace(reN, ""), 10);
                        var bN = parseInt(b.replace(reN, ""), 10);
                        //return aN === bN ? 0 : aN > bN ? 1 : -1;
                        if (aN > bN) return 1;
                        if (aN < bN) return -1;
                      } else {
                        //return aA > bA ? 1 : -1;
                        if (aA > bA) return 1;
                        if (aA < bA) return -1;
                      }
    
                      if (obj1.id > obj2.id) return 1;
                      if (obj1.id < obj2.id) return -1;
    
                      return 0;
                    })
    
                    V.annotations.forEach((anno) => {
                      // console.log("V.annotations.forEach((anno)")
                      // console.log(anno)
                      let loadAnno = JSON.parse(anno.annotation);
                      let rects = [];
                      let linepaths = [];
                      let tmpAnnoData;
    
                      // console.log(loadAnno)
    
                      if (V.slideName == anno.filename) {
                        // console.log("same slide_name")
                        if (loadAnno.end) {
                          // console.log("loadAnno.start")
                          loadAnno.end[1].id = anno.id;
                          //loadAnno.start[1].id = anno.id;
                          //loadAnno.start[1].title = loadAnno.end[2];
                          //loadAnno.end[1].title = loadAnno.end[2];
    
                          //model.annotations.push(loadAnno.start);
                          model.annotations.push(loadAnno.end);
    
                          tmpAnnoData = V.toRectData(anno, loadAnno);
    
                          if (tmpAnnoData.annotation) {
                            linepaths.push(tmpAnnoData);
                          }
                        } else {
                          console.log("loadAnno.start flase")
                          rects.push(anno);
                        }
    
                        // 아페리오 변환시 리전의 개수로 속도 저하.... 라벨과 바운더리 처리 안함
                        if ($("#gap").val()=='' || $("#gap").val()==undefined){
                          V.drawAnnotations(rects, 'rect'); // 기존 rect 어노테이션 표시
                          V.drawAnnotations(linepaths, 'linepath');
                          // V.createAnnotationLink(anno);//해당 파일의 어너테이션 목록 표시
                        }
    
                      }
                      V.createAnnotationLink(anno);// 전체 파일의 어너테이션 목록 표시(어노테이션 링크이동 완료후 사용)
                    })
                    console.timeEnd('V.annotations.drawAnnotations');
                    //어노테이션 목록 설명 팝업
                    $('[data-toggle="popover"]').popover({ trigger: "hover", html:true, placement:"bottom" })
    
                    $.contextMenu({
                      selector : ".rect-anno",
                      position: function(opt, x, y){
                            opt.$menu.css({width:100,top:y,left:x});
                        },
                      items : {
                        "export" : {
                          name : "Export ROI",
                          icon : "delete",
                          callback : function(key, opt) {
                            console.log(opt.$trigger[0].id);
                            let annotationid =  opt.$trigger[0].id
                            let coordinates = JSON.parse(V.annotations.find(anno => anno.id == annotationid).annotation).end[1]
                            console.log(coordinates)
                            const size = V.viewer.viewport._contentSize;
                            const x = coordinates.x * size.x / 100;
                            const y = coordinates.y * size.y / 100;
                            const width = coordinates.width * size.x / 100;
                            const height = coordinates.height * size.y / 100;
                          
                            var idx = opt.$trigger[0].dataset.id;
                            console.log(opt.$trigger[0]);
                            console.log("V.pathology_id="+V.pathology_id);
                            console.log("V.slideName="+V.slideName);
                            console.log("V.slide.path"+V.slide.path);
                            var extractionUrl = V.serveEndPoint + V.slide.path + "/extract/0/" + x.toFixed(0) + "_" + y.toFixed(0) + "/" + width.toFixed(0) + "_" + height.toFixed(0) + ".jpeg"
                            console.log(extractionUrl)
                            console.log(extractionUrl.replace(/#/gi, '%23').replace(/\(/gi, '%28').replace(/\)/gi, '%29').replace(/\s/gi, '%20'))
                            location.href = extractionUrl.replace(/#/gi, '%23').replace(/\(/gi, '%28').replace(/\)/gi, '%29').replace(/\s/gi, '%20');
                            
    
                            // $.ajax({
                            //   url : '/delPixelScale',
                            //   type : "GET",
                            //   data : {
                            //     pathology_id : V.pathology_id,
                            //     filename : V.slideName
                            //   },
                            //   success : function(result) {
                            //     var name = V.slideName
                            //     var slide = V.slides.find(function(e) {
                            //       return e.name == name
                            //     })
                            //     V.slideMpp=null;
                            //     slide.pixelsPerCentimeter=null;
                            //     V.open(slide);
                
                            //   },
                            //   complete : function() {
                            //     console.log("complete");
                            //   }
                            // });
                
                          }
                        }
                      }
                    });
                  },
                  afterOnClick: (e) => {
                    console.log("#afterOnClick: ()")
                    console.log(e);
                    // selection libray 제거
                    //V.viewer.selectionInstance.setState(false);
                    // selection libray 제거
                  }
                }); // OpenSeadragon.Assnotations();
    
                V.annotationPlugin.EnableControls(true);
    
                //권한별 어노테이션 기능 숨기기
                // if ($("#dept").val()!='P'){
                //   $("div[title='Toggle selection'], div[title='LineDraw'], div[title='FreeDraw']").hide();
                //   alert("xxxx");
                // }
                //권한별 어노테이션 기능 숨기기
    
                V.annotationPlugin.setModeToMove = () => {
                  V.annotationPlugin.model.mode = 'MOVE';
                  V.annotationPlugin.model.raiseEvent('MODE_UPDATE');
                }
    
              })
            } // if viewer is null
    
            // selection libray 제거
            // V.viewer.selection({
            //   onSelection: (rect) => {
            //     V.onSelection(rect);
            //   },
            //   onToggle: () => {
            //     setTimeout(() => {
            //       V.annotationPlugin.setModeToMove();
            //     }, 0)
    
            //   }
            // })
            // selection libray 제거
          },
    
          saveRullerInit: async function (model, anno, length, lengthUnit) {
            console.log("##saveRullerInit");
            console.log("model.annotations[model.annotations.length - 1]");
            console.log(model.annotations[model.annotations.length - 1]);
            const linelength = V.annotationPlugin.getLength(model.annotations[model.annotations.length - 1]);
    
            let pixelScale = {
              pathology_id: V.slide.pathologyNumber, //해당 슬라이드의 병리번호 세팅
              filepath: V.slide.path,
              pixels: linelength.toFixed(0),
              length: length,
              lengthUnit: lengthUnit
            };
    
            V.annotationPlugin.model.annotations.splice(V.annotationPlugin.model.annotations.length - 2, 2);
            V.annotationPlugin.setAnnotations(V.annotationPlugin.model.annotations);
            V.annotationPlugin.setModeToMove();
    
            var _pixelScale = await $.savePixelScale(pixelScale);
    
            console.log("###savePixelScale(pixelScale)");
            console.log(_pixelScale);
    
            let slide = V.slides.find(slide => slide.name == V.slide.name)
    
            slide.pixelsPerCentimeter = _pixelScale.pixelsPerCentimeter;
            slide.lengthUnit = _pixelScale.lengthUnit;
    
            V.slideMpp = 1 / _pixelScale.pixelsPerCentimeter * 10000; // pixels per centimeter => Microns per pixel
            V.lengthUnit = _pixelScale.lengthUnit;
    
            V.viewer.scalebar({
              pixelsPerMeter: _pixelScale.pixelsPerCentimeter * 100
            });
          },
    
          toRectData: (anno, linepathAnno) => {
           console.log("toRectData: (anno, linepathAnno) ")
            function min(x, y) {
              if (parseFloat(x) > parseFloat(y)) {
                return parseFloat(y);
              } else {
                return parseFloat(x);
              }
            }
    
            function max(x, y) {
              if (parseFloat(x) < parseFloat(y)) {
                return parseFloat(y)
              } else {
                return parseFloat(x);
              }
            }
    
            const size = V.viewer.viewport._contentSize;
            let resultBound = null;
    
            if (linepathAnno.end[0] === 'line') {
              const w = Math.abs(linepathAnno.end[1].x1 - linepathAnno.end[1].x2) * size.x / 100;
              const h = Math.abs(linepathAnno.end[1].y1 - linepathAnno.end[1].y2) * size.y / 100;
    
              const x = min(linepathAnno.end[1].x1, linepathAnno.end[1].x2) * size.x / 100;
              const y = min(linepathAnno.end[1].y1, linepathAnno.end[1].y2) * size.y / 100;
    
              resultBound = {
                x: parseInt(x),
                y: parseInt(y),
                width: parseInt(w),
                height: parseInt(h)
              }
            } else if (linepathAnno.end[0] === 'path') {
              resultBound = V.getPathBound(linepathAnno.end[1].d);
    
              resultBound.x = resultBound.x * size.x / 100
              resultBound.y = resultBound.y * size.y / 100
              resultBound.width = resultBound.width * size.x / 100
              resultBound.height = resultBound.height * size.y / 100
            } else if (linepathAnno.end[0] === 'rect') {
              resultBound = {
                x: linepathAnno.end[1].x * size.x / 100,
                y: linepathAnno.end[1].y * size.y / 100,
                width: linepathAnno.end[1].width * size.x / 100,
                height: linepathAnno.end[1].height * size.y / 100
              }
            } else if (linepathAnno.end[0] === 'ellipse') {
                resultBound = {
                  x: (linepathAnno.end[1].cx - linepathAnno.end[1].rx) * size.x / 100,
                  y: (linepathAnno.end[1].cy - linepathAnno.end[1].ry) * size.y / 100,
                  width: linepathAnno.end[1].rx * 2 * size.x / 100,
                  height: linepathAnno.end[1].ry * 2 * size.y / 100
                }
            } else {
              console.log('Unknown svg type');
            }
    
            return {
              id: anno.id,
              pathlogy_id: anno.pathology_id,
              filename: anno.filename,
              imageType: anno.imageType,
              title: anno.title,
              length: anno.length || '',
              lengthUnit: anno.lengthUnit || '',
              annotation: JSON.stringify(resultBound)
            }
          },
    
          _drawRectAnnotation: (ele, rect) => {
            console.log('#_drawRectAnnotation: (ele, rect)');
            console.log(ele);
            console.log(rect);
    
            let shape = JSON.parse(rect.annotation);
    
            if ((typeof shape.end) === 'undefined') {
              V.viewer.addOverlay({
                element: ele,
                location: V.viewer.viewport.imageToViewportRectangle(shape.x, shape.y, shape.width, shape.height),
                placement: OpenSeadragon.OverlayPlacement.BOTTOM
              });
    
              $("div[id=" + ele.id + "]").css("outline", "2px solid #696969");
            } else {
              console.log("no rect");
              console.trace();
            }
    
            return rect.id
          },
    
          _drawBound: (ele, rect) => {
            console.log('#_drawBound: (ele, rect)');
            console.log(ele);
            console.log(rect);
            // console.log("rect.annotation=" + rect.annotation);
            // console.log("rect.id=" + rect.id);
            let shape = JSON.parse(rect.annotation);
    
            // console.log('shape.x=' + shape.x);
            // console.log('shape.y=' + shape.y);
    
            V.viewer.addOverlay({
              element: ele,
              location: V.viewer.viewport.imageToViewportRectangle(shape.x, shape.y, shape.width, shape.height),
              placement: OpenSeadragon.OverlayPlacement.BOTTOM
            });
    
            //$("div[id=" + ele.id + "]").css("outline", "1px dotted rgba(153, 0, 0, 0.2)");
    
            return rect.id
          },
    
          justHideAnnotations: () => {
            let anno = $(".rect-anno, path, line");
            anno.removeClass('show');
            anno.addClass('hide');
          },
    
          justShowAnnotations: () => {
            let anno = $(".rect-anno, path, line");
            anno.removeClass('hide');
            anno.addClass('show');
          }
        }
    
        $("#" + viewerId + ">" + ".openseadragon-container").remove();
        $("#labelViewer" + V.imageType + ">" + ".openseadragon-container").remove();
    
        V.init(viewerId, imageType)
        V.setEvent()
    
      }
      // })