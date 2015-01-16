module Drive
  class SectionUser < ActiveRecord::Base
    self.table_name = "section_users"
    belongs_to :section, counter_cache: "user_count"
    belongs_to :user
  end

  # == Schema Information
  #
  # Table name: section_users
  #
  #  id         :integer          not null, primary key
  #  section_id   :integer          not null
  #  user_id    :integer          not null
  #  created_at :datetime         not null
  #  updated_at :datetime         not null
  #
  # Indexes
  #
  #  index_section_users_on_section_id_and_user_id  (section_id,user_id) UNIQUE
  #

end
