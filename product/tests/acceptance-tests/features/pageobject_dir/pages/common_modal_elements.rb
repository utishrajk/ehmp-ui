class ModalElements < SitePrism::Page
  element :fld_modal_title, '#mainModalLabel'
  element :btn_close, '#modal-close-button'
  element :btn_x_close, '.modal-header button.close'
  elements :fld_modal_detail_labels, "#modal-body [data-detail-label]"
end
