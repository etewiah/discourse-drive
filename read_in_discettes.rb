# Update the filenames for each discette in the public folder
module Drive
  class DiscetteUpdater
    def self.update_discette discette, drive_dir
      files_hash = { "css" => [] , "js" => [] }
      drive_files = Dir.glob(drive_dir + "/assets/*")
      drive_files.each do |drive_file|
        if File.extname(drive_file) == ".css"
          files_hash["css"].push( File.split(drive_file)[1] )
        elsif File.extname(drive_file) == ".js"
          files_hash["js"].push( File.split(drive_file)[1] )
        end
      end
      discette.meta = discette.meta || {}
      discette.meta["files"] = files_hash
      discette.save!
    end

    def self.read_in_discettes
      drive_dirs = Dir["#{Rails.root}/plugins/discourse-drive/public/drives/**"]
      drive_dirs.each do |drive_dir|
        drive_name = File.split(drive_dir)[1]
        discette = Drive::Discette.where(:slug => drive_name).first
        if discette
          Drive::DiscetteUpdater.update_discette discette, drive_dir
        end
      end
      # binding.pry
    end

  end
end

Drive::DiscetteUpdater.read_in_discettes


# temporary hack to get madrid topics available in section
Category.where(:name => "Madrid").first.topics.each do |topic|
  if topic.archetype == "regular"
    topic.archetype = "discette"
    topic.save!
  end
end

