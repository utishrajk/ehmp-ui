Then(/^POB user opens the Notes applet$/) do
  ehmp = PobNotes.new
  ehmp.wait_until_btn_notes_visible
  expect(ehmp).to have_btn_notes
  ehmp.btn_notes.click
  ehmp.wait_until_fld_notes_applet_loaded_visible(30)
  expect(ehmp).to have_fld_notes_applet_loaded
end

Then(/^POB Notes applet displays the following headings$/) do |table|
  ehmp = PobNotes.new
  max_attempt = 4
  begin
    ehmp.wait_until_fld_all_headings_visible
    table.rows.each do |heading|
      expect(object_exists_in_list(ehmp.fld_all_headings, "#{heading[0]}")).to eq(true)
    end
  rescue Exception => e
    p "Exception received: trying again"
    max_attempt-=1
    raise e if max_attempt <= 0
    retry if max_attempt > 0
  end
end

Then(/^POB Notes applet has "(.*?)" button$/) do |new_note|
  ehmp = PobNotes.new
  ehmp.wait_until_btn_new_notes_visible
  expect(ehmp.btn_new_notes).to have_text(new_note)
end

Then(/^POB user opens New Note to create a note$/) do
  ehmp = PobNotes.new
  ehmp.wait_for_btn_new_notes
  ehmp.wait_until_btn_new_notes_visible
  expect(ehmp).to have_btn_new_notes
  ehmp.btn_new_notes.click
  expect(ehmp).to have_fld_new_note_loaded
end

Then(/^POB user opens note objects button$/) do
  @ehmp = PobNotes.new
  @ehmp.wait_for_btn_obj
  @ehmp.wait_until_btn_obj_visible(30) 
  expect(@ehmp).to have_btn_obj
  rows = @ehmp.btn_obj
  expect(rows.length >= 1).to eq(true), "there should be at least one button, found only #{rows.length}"
  wait = Selenium::WebDriver::Wait.new(:timeout => 5)
  wait.until { @ehmp.btn_obj[0].disabled? != true }
  @ehmp.wait_for_btn_obj
  @ehmp.btn_obj[0].click
end

Then(/^POB New Notes form displays the heading "(.*?)"$/) do |input|
  ehmp = PobNotes.new
  ehmp.wait_until_fld_note_form_header_visible
  expect(ehmp.fld_note_form_header).to have_text(input)
end

Then(/^POB New Notes form displays the "(.*?)" with drop down list$/) do |input|
  ehmp = PobNotes.new
  ehmp.wait_until_fld_note_title_label_visible
  expect(ehmp.fld_note_title_label.text.upcase).to have_text(input.upcase)
  ehmp.wait_until_fld_note_title_visible
  expect(ehmp).to have_fld_note_title
end

Then(/^POB New Notes form displays the date field "(.*?)"$/) do |input|
  ehmp = PobNotes.new
  ehmp.wait_until_fld_note_date_label_visible
  expect(ehmp.fld_note_date_label.text.upcase).to have_text(input.upcase)
  ehmp.wait_until_fld_note_date_visible
  expect(ehmp).to have_fld_note_date
end

Then(/^POB New Notes form displays the time field "(.*?)"$/) do |input|
  ehmp = PobNotes.new
  ehmp.wait_until_fld_note_time_label_visible
  expect(ehmp.fld_note_time_label.text.upcase).to have_text(input.upcase)
  ehmp.wait_until_fld_note_time_visible
  expect(ehmp).to have_fld_note_time
end

Then(/^POB New Notes form displays the note body "(.*?)"$/) do |input|
  ehmp = PobNotes.new
  ehmp.wait_until_fld_note_body_label_visible
  expect(ehmp.fld_note_body_label.text.upcase).to have_text(input.upcase)
  ehmp.wait_until_fld_note_body_visible
  expect(ehmp).to have_fld_note_body
end

Then(/^POB New Notes displays buttons$/) do |table|
  ehmp = PobNotes.new
  ehmp.wait_until_btn_all_visible
  table.rows.each do |buttons|
    expect(object_exists_in_list(ehmp.btn_all, "#{buttons[0]}")).to eq(true), "Button '#{buttons[0]}' was not found"
  end
end

Then(/^POB New Notes displays sidebar\-subtray$/) do |table|
  ehmp = PobNotes.new
  ehmp.wait_until_btn_obj_visible
  table.rows.each do |obj|
    expect(object_exists_in_list(ehmp.btn_obj, "#{obj[0]}")).to eq(true), "Button '#{obj[0]}' was not found"
  end
end

Then(/^POB user creates New Note "(.*?)"$/) do |note_title|
  ehmp = PobNotes.new
  ehmp.wait_until_fld_note_title_visible(30)
  expect(ehmp).to have_fld_note_title
  ehmp.fld_note_title.click
  com = PobCommonElements.new
  com.wait_until_fld_pick_list_input_visible
  com.fld_pick_list_input.set note_title
  com.fld_pick_list_input.native.send_keys(:enter)
  wait = Selenium::WebDriver::Wait.new(:timeout => 5)
  wait.until { ehmp.fld_note_body.disabled? == false }
  ehmp.wait_for_fld_note_body
  ehmp.wait_until_fld_note_body_visible(30)
  ehmp.fld_note_body.set "Note Body: " + note_title
  expect(ehmp.fld_note_title).to have_text(note_title)
end

Then(/^POB user saves the note "(.*?)"$/) do |note_title|
  ehmp = PobNotes.new
  ehmp.wait_until_btn_close_visible
  expect(ehmp).to have_btn_close
  ehmp.btn_close.click
  verify_and_close_growl_alert_pop_up("Note Saved")
  ehmp.wait_for_fld_unsigned_notes_section
  ehmp.wait_until_fld_unsigned_notes_section_visible
  expect(ehmp.fld_unsigned_notes_section).to have_text(note_title)
end

Then(/^POB user signs the note "(.*?)" as "(.*?)"$/) do |note_title, esignature|
  ehmp = PobNotes.new
  ehmp.wait_until_btn_sign_visible
  expect(ehmp).to have_btn_sign
  ehmp.btn_sign.click
  ehmp.wait_until_fld_signature_input_box_visible
  ehmp.fld_signature_input_box.set esignature
  ehmp.wait_until_btn_esign_visible
  expect(ehmp).to have_btn_esign
  ehmp.btn_esign.click
  verify_and_close_growl_alert_pop_up("Signature Submitted")
  ehmp.wait_for_fld_recently_signed_notes_section
  ehmp.wait_until_fld_recently_signed_notes_section_visible
  expect(ehmp.fld_recently_signed_notes_section).to have_text(note_title)
end

Then(/^POB user sees the new note "(.*?)" under unsigned notes header$/) do |note_title|
  ehmp = PobNotes.new
  ehmp.wait_until_fld_unsigned_notes_section_visible
  expect(ehmp.fld_unsigned_notes_section).to have_text(note_title)
end

Then(/^POB user sees the new note "(.*?)" under recently signed notes header$/) do |note_title|
  ehmp = PobNotes.new
  ehmp.wait_until_fld_recently_signed_notes_section_visible
  expect(ehmp.fld_recently_signed_notes_section).to have_text(note_title)
end

Then(/^POB user opens note "(.*?)" and edits$/) do |note_title|
  ehmp = PobNotes.new
  max_attempt = 4
  begin
    ehmp.wait_until_fld_unsigned_notes_section_visible
    ehmp.wait_until_fld_unsigned_notes_list_visible
    click_an_object_from_list(ehmp.fld_unsigned_notes_list, note_title)
  rescue Exception => e
    puts "Unsigned notes list got refreshed,  need to search and click again"
    max_attempt-=1
    raise e if max_attempt <= 0
    retry if max_attempt > 0
  end    
  ehmp.wait_for_fld_new_note_loaded
  ehmp.wait_until_fld_new_note_loaded_visible(30)
  expect(ehmp).to have_fld_new_note_loaded
  ehmp.wait_for_fld_note_body
  ehmp.wait_until_fld_note_body_visible(30)
  ehmp.wait_until_btn_close_visible(30)
  ehmp.fld_note_body.set "Note Body: " + note_title + " Edited"  
end

Then(/^POB user previews note "(.*?)"$/) do |note_title|
  ehmp = PobNotes.new
  ehmp.wait_until_btn_preview_visible
  expect(ehmp).to have_btn_preview
  ehmp.btn_preview.click
  ehmp.wait_until_fld_note_preview_title_visible
  ehmp.wait_until_fld_note_preview_content_visible
  expect(ehmp.fld_note_preview_content).to have_text("Note Body: " + note_title + " Edited")
  ehmp.wait_until_btn_preview_close_visible
  expect(ehmp).to have_btn_preview_close
  ehmp.btn_preview_close.click
end

Then(/^POB user deletes all unsigned notes created$/) do
  ehmp = PobNotes.new
  ehmp.wait_until_fld_unsigned_notes_section_visible
  ehmp.wait_until_fld_unsigned_notes_list_visible
  i = 0
  until ehmp.fld_unsigned_notes_list[i].text.include? "No Unsigned Notes." 
#    print "i = "
#    p i
#    print "Note Details = "
#    p ehmp.fld_unsigned_notes_list[i].text
    ehmp.fld_unsigned_notes_list[i].click 
    wait = Selenium::WebDriver::Wait.new(:timeout => 5)
    wait.until { ehmp.fld_note_body.disabled? == false }
    delete_unsigned_note
  end 
  expect(ehmp.fld_unsigned_notes_section).to have_text("No Unsigned Notes.")
end

def delete_unsigned_note
  ehmp = PobNotes.new
  ehmp.wait_until_btn_delete_visible(30)
  expect(ehmp).to have_btn_delete
  ehmp.btn_delete.click
  ehmp.wait_until_btn_delete_confirmation_visible
  expect(ehmp).to have_btn_delete_confirmation

  max_attempt = 3
  begin
    ehmp.btn_delete_confirmation.click
    ehmp.wait_until_btn_delete_confirmation_invisible
  rescue => e
    max_attempt-=1
    raise e if max_attempt <= 0
    p "#{e} reattempt"
    sleep 0.5
    retry if max_attempt > 0
  end
  verify_and_close_growl_alert_pop_up("Success")
  ehmp.wait_until_fld_unsigned_notes_section_visible
end



